// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   OneToMany,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { WorkoutRoutine } from './workout-routine.entity';
// import { ExerciseSet } from './exercise-set.entity';

// @Entity('exercises')
// export class Exercise {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   name: string;

//   @Column({ nullable: true })
//   description: string;

//   @Column({ nullable: true })
//   notes: string;

//   @Column({ nullable: true })
//   targetMuscleGroup: string;

//   @Column({ default: 0 })
//   restPeriod: number; // in seconds

//   @ManyToOne(() => WorkoutRoutine, (routine) => routine.exercises)
//   routine: WorkoutRoutine;

//   @OneToMany(() => ExerciseSet, (set) => set.exercise, { cascade: true })
//   sets: ExerciseSet[];

//   @Column({ type: 'datetime', nullable: true })
//   lastPerformed: Date;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
