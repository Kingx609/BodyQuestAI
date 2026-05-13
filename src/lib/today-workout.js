const storageKey = (todayStr) => `bodyquest_today_workout_${todayStr}`;

export const rememberTodayWorkout = (todayStr, workout) => {
  if (typeof window === 'undefined' || !workout?.id) return;
  window.localStorage.setItem(storageKey(todayStr), workout.id);
};

export const fetchTodayWorkout = async (base44, todayStr) => {
  const plannedForToday = await base44.entities.Workout.filter({ planned_date: todayStr });
  if (plannedForToday?.length) return plannedForToday;

  if (typeof window === 'undefined') return [];

  const selectedWorkoutId = window.localStorage.getItem(storageKey(todayStr));
  if (!selectedWorkoutId) return [];

  const selectedWorkout = await base44.entities.Workout.filter({ id: selectedWorkoutId });
  return selectedWorkout?.[0] ? [selectedWorkout[0]] : [];
};

export const createTodayWorkout = async (base44, todayStr, workoutDraft) => {
  const existingToday = await base44.entities.Workout.filter({ planned_date: todayStr });
  if (typeof base44.entities.Workout.delete === 'function') {
    await Promise.all((existingToday || [])
      .filter(workout => workout?.id)
      .map(workout => base44.entities.Workout.delete(workout.id).catch(() => null)));
  }

  const saved = await base44.entities.Workout.create({
    ...workoutDraft,
    is_template: false,
    planned_date: todayStr,
  });

  rememberTodayWorkout(todayStr, saved);
  return saved;
};
