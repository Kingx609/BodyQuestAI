import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

const CATEGORIES = ['push', 'pull', 'legs', 'chest', 'back', 'arms', 'shoulders', 'glutes', 'upper_body', 'lower_body', 'full_body', 'custom'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function CreateWorkout() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [duration, setDuration] = useState('60');
  const [scheduledDay, setScheduledDay] = useState('');
  const [exercises, setExercises] = useState([{ name: '', muscle_group: '', target_sets: 4, target_reps: 10 }]);

  const addExercise = () => setExercises([...exercises, { name: '', muscle_group: '', target_sets: 4, target_reps: 10 }]);
  const removeExercise = (i) => setExercises(exercises.filter((_, idx) => idx !== i));
  const updateExercise = (i, field, val) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], [field]: val };
    setExercises(updated);
  };

  const handleSave = async () => {
    const data = {
      name,
      category,
      estimated_duration: parseInt(duration),
      scheduled_day: scheduledDay || undefined,
      exercises: exercises.filter(e => e.name),
      is_template: true,
    };
    await base44.entities.Workout.create(data);
    navigate('/workout');
  };

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create Workout</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Workout Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chest & Traps" className="mt-1 bg-secondary border-border text-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Duration (min)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Schedule Day (optional)</Label>
          <Select value={scheduledDay} onValueChange={setScheduledDay}>
            <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-muted-foreground">Exercises</Label>
            <Button size="sm" variant="outline" onClick={addExercise} className="border-border text-muted-foreground">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} placeholder="Exercise name" className="bg-secondary border-border text-foreground flex-1" />
                  <Button size="icon" variant="ghost" onClick={() => removeExercise(i)} className="text-muted-foreground h-8 w-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={ex.muscle_group} onChange={e => updateExercise(i, 'muscle_group', e.target.value)} placeholder="Muscle" className="bg-secondary border-border text-foreground text-xs" />
                  <Input type="number" value={ex.target_sets} onChange={e => updateExercise(i, 'target_sets', parseInt(e.target.value))} placeholder="Sets" className="bg-secondary border-border text-foreground text-xs" />
                  <Input type="number" value={ex.target_reps} onChange={e => updateExercise(i, 'target_reps', parseInt(e.target.value))} placeholder="Reps" className="bg-secondary border-border text-foreground text-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!name} className="w-full bg-primary text-primary-foreground glow-blue-sm font-semibold mt-4">
          <Save className="w-4 h-4 mr-2" /> Save Workout
        </Button>
      </div>
    </div>
  );
}
