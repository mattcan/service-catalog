import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Service } from './service.entity'

@Entity()
export class Version {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 200 })
  tag: string

  @Column('text')
  description: string

  @ManyToOne(
    (type) => Service,
    (svc) => svc.versions,
  )
  service: Service

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
