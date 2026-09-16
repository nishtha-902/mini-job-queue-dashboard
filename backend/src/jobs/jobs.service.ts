import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { Job } from './job.entity';
import { JobStatus } from './job-status.enum';

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING, JobStatus.FAILED],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

  async create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepository.create({
      title: dto.title.trim(),
      type: dto.type.trim(),
      status: JobStatus.PENDING,
    });

    return this.jobsRepository.save(job);
  }

  async findAll(): Promise<Job[]> {
    return this.jobsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateJobStatusDto,
  ): Promise<Job> {
    const requestedStatus = dto.status;

    const current = await this.jobsRepository.findOne({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (current.status === requestedStatus) {
      return current;
    }

    if (!ALLOWED_TRANSITIONS[current.status].includes(requestedStatus)) {
      throw new ConflictException(
        `Invalid status transition: ${current.status} -> ${requestedStatus}`,
      );
    }

    // The WHERE status = current.status is the concurrency guard.
    // If another request changes the job first, affected === 0.
    const result = await this.jobsRepository
      .createQueryBuilder()
      .update(Job)
      .set({ status: requestedStatus })
      .where('id = :id', { id })
      .andWhere('status = :currentStatus', {
        currentStatus: current.status,
      })
      .execute();

    if (result.affected !== 1) {
      throw new ConflictException(
        'The job was changed by another request. Refresh and try again.',
      );
    }

    const updated = await this.jobsRepository.findOne({
      where: { id },
    });

    if (!updated) {
      throw new NotFoundException(`Job ${id} no longer exists`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobsRepository.delete(id);

    if (result.affected !== 1) {
      throw new NotFoundException(`Job ${id} not found`);
    }
  }
}
