#!/bin/bash

echo "Final cleanup of remaining hardcoded colors..."

# Fix specific remaining instances
sed -i '' 's/from-green-500 to-emerald-500/from-primary to-primary/g' src/pages/teacher/ViewMerits.tsx
sed -i '' 's/from-blue-500 to-cyan-500/from-secondary to-secondary/g' src/pages/teacher/ViewMerits.tsx
sed -i '' 's/from-purple-500 to-indigo-500/from-secondary to-secondary/g' src/pages/teacher/ViewMerits.tsx

sed -i '' 's/from-blue-50 to-indigo-50/from-surface to-surface/g' src/pages/teacher/TeacherProfile.tsx
sed -i '' 's/border-blue-200/border-border/g' src/pages/teacher/TeacherProfile.tsx
sed -i '' 's/text-blue-600/text-secondary/g' src/pages/teacher/TeacherProfile.tsx

sed -i '' 's/from-blue-500 to-cyan-500/from-secondary to-secondary/g' src/pages/teacher/TeacherDashboard.tsx
sed -i '' 's/from-blue-50 to-cyan-50/from-surface to-surface/g' src/pages/teacher/TeacherDashboard.tsx
sed -i '' 's/from-blue-50 to-indigo-50/from-surface to-surface/g' src/pages/teacher/TeacherDashboard.tsx
sed -i '' 's/border-blue-500/border-primary/g' src/pages/teacher/TeacherDashboard.tsx
sed -i '' 's/from-blue-500 to-indigo-500/from-secondary to-secondary/g' src/pages/teacher/TeacherDashboard.tsx

sed -i '' 's/bg-orange-100 text-orange-700 border-orange-200/bg-surface text-primary border-border/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/from-orange-500 to-red-600/from-primary to-error/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/hover:bg-blue-100/hover:bg-surface/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/text-blue-600/text-secondary/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/from-blue-500 to-indigo-600/from-secondary to-secondary/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/bg-green-50/bg-surface/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/text-green-600/text-success/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/text-green-700/text-success/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/bg-orange-50 border-orange-300/bg-surface border-border/g' src/pages/teacher/Consequences.tsx
sed -i '' 's/bg-blue-50 border-blue-300/bg-surface border-border/g' src/pages/teacher/Consequences.tsx

sed -i '' 's/bg-green-100 text-green-800 border-green-300/bg-surface text-success border-border/g' src/pages/teacher/TeacherPeriodTimetable.tsx
sed -i '' 's/bg-blue-600 text-white/bg-secondary text-white/g' src/pages/teacher/TeacherPeriodTimetable.tsx
sed -i '' 's/from-blue-500 to-blue-600/from-secondary to-secondary/g' src/pages/teacher/TeacherPeriodTimetable.tsx
sed -i '' 's/text-blue-600/text-secondary/g' src/pages/teacher/TeacherPeriodTimetable.tsx
sed -i '' 's/hover:bg-blue-50/hover:bg-surface/g' src/pages/teacher/TeacherPeriodTimetable.tsx

# Fix AuthCallback if needed
sed -i '' 's/from-blue-500/from-secondary/g' src/pages/AuthCallback.tsx

echo "Final cleanup complete!"
