import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useProgress } from '@/context/ProgressContext'

export default function ProgressBar({ reportId, className = '' }) {
  const { getProgressForReport } = useProgress()
  const progressInfo = getProgressForReport(reportId)

  if (!progressInfo) {
    return null
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'inprogress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/50 text-green-300 border-green-700/50'
      case 'failed':
        return 'bg-red-900/50 text-red-300 border-red-700/50'
      case 'inprogress':
        return 'bg-blue-900/50 text-blue-300 border-blue-700/50'
      default:
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50'
    }
  }

  return (
    <div className={`space-y-3 p-4 bg-card/50 border border-border/50 rounded-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(progressInfo.status)}
          <Badge className={`text-xs ${getStatusColor(progressInfo.status)}`}>
            Report #{reportId}
          </Badge>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {progressInfo.progress}%
        </span>
      </div>
      
      <Progress 
        value={progressInfo.progress} 
        className="h-2 bg-muted/50"
      />
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {progressInfo.message}
        </span>
        {progressInfo.timestamp && (
          <span className="text-xs text-muted-foreground">
            {new Date(progressInfo.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}