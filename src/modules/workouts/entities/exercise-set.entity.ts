// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
// } from 'typeorm';
// import { Exercise } from './exercise.entity';
// import { WorkoutSession } from './workout-session.entity';

// @Entity('exercise_sets')
// export class ExerciseSet {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   setNumber: number;

//   @Column({ type: 'float', nullable: true })
//   weight: number;

//   @Column({ nullable: true })
//   reps: number;

//   @Column({ nullable: true })
//   duration: number; // in seconds

//   @Column({ default: false })
//   isWarmupSet: boolean;

//   @Column({ nullable: true })
//   rpe: number; // Rate of Perceived Exertion (1-10)

//   @ManyToOne(() => Exercise, (exercise) => exercise.sets)
//   exercise: Exercise;

//   @ManyToOne(() => WorkoutSession, (session) => session.sets)
//   session: WorkoutSession;

//   @CreateDateColumn()
//   createdAt: Date;
// }
