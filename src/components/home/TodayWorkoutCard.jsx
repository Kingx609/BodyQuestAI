import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Clock, TrendingUp, Play, Settings } from 'lucide-react';

export default function TodayWorkoutCard({ workout }) {
  if (!workout) {
    return (
      <div className="rounded-2xl card-glass p-5">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Today's Workout</h3>
        </div>
        <p className="text-foreground font-bold text-lg mb-1">No workout planned</p>
        <p className="text-sm text-muted-foreground mb-4">Create a workout or let AI build one for you.</p>
        <Link to="/workout">
          <Button className="w-full bg-primary text-primary-foreground glow-blue-sm">Create Workout</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl card-glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Today's Workout</h3>
      </div>
      <p className="text-foreground font-bold text-xl">{workout.name}</p>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1.5 mb-4">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{workout.estimated_duration || 60} min</span>
        <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {workout.exercises?.length || 0} exercises</span>
      </div>
      <div className="flex gap-2">
        <Link to={`/active-workout/${workout.id}`} className="flex-1">
          <Button className="w-full bg-primary text-primary-foreground glow-blue-sm font-semibold">
            <Play className="w-4 h-4 mr-2" /> Start Workout
          </Button>
        </Link>
        <Link to={`/workout/edit/${workout.id}`}>
          <Button variant="outline" className="border-border bg-secondary text-muted-foreground">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}