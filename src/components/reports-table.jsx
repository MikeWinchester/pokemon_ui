"use client"

import { useState, useEffect } from "react"
import { Download, RefreshCw, ArrowUpDown, Trash2, FileText, Clock, CheckCircle2, Database, Wifi } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSSE } from "@/hooks/useSSE"
import { getReports } from "@/services/report-service"

export default function ReportsTable({ reports, loading, onRefresh, onDownload, onDelete }) {
  const [refreshing, setRefreshing] = useState(false)
  const [sortedReports, setSortedReports] = useState([])
  const [sortDirection, setSortDirection] = useState("desc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [localReports, setLocalReports] = useState(reports)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  
  const sse = useSSE()

  // Inicializar reportes locales
  useEffect(() => {
    setLocalReports(reports)
  }, [reports])

  // Auto-refresh cuando hay actualizaciones vía SSE
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const handleReportUpdate = async (data) => {
      console.log('Report updated via SSE:', data)
      try {
        // Refrescar datos automáticamente
        const updatedReports = await getReports()
        setLocalReports(updatedReports)
      } catch (error) {
        console.error('Error auto-refreshing reports:', error)
      }
    }

    const handleReportCreated = async (data) => {
      console.log('Report created via SSE:', data)
      try {
        // Refrescar datos automáticamente
        const updatedReports = await getReports()
        setLocalReports(updatedReports)
      } catch (error) {
        console.error('Error auto-refreshing reports:', error)
      }
    }

    const handleReportDeleted = async (data) => {
      console.log('Report deleted via SSE:', data)
      // Filtrar el reporte eliminado localmente
      setLocalReports(prev => prev.filter(r => r.ReportId !== data.id))
    }

    const unsubscribeUpdate = sse.subscribe('report_updated', handleReportUpdate)
    const unsubscribeCreated = sse.subscribe('report_created', handleReportCreated)
    const unsubscribeDeleted = sse.subscribe('report_deleted', handleReportDeleted)

    return () => {
      unsubscribeUpdate()
      unsubscribeCreated()
      unsubscribeDeleted()
    }
  }, [sse, autoRefreshEnabled])

  // Sort reports when they change or when sort direction changes
  useEffect(() => {
    if (!localReports || localReports.length === 0) {
      setSortedReports([])
      return
    }

    const reportsCopy = [...localReports]
    const sorted = reportsCopy.sort((a, b) => {
      const dateA = new Date(getPropertyValue(a, "updated_at"))
      const dateB = new Date(getPropertyValue(b, "updated_at"))

      const isValidDateA = !isNaN(dateA.getTime())
      const isValidDateB = !isNaN(dateB.getTime())

      if (isValidDateA && isValidDateB) {
        return sortDirection === "desc" ? dateB - dateA : dateA - dateB
      }

      if (isValidDateA) return sortDirection === "desc" ? -1 : 1
      if (isValidDateB) return sortDirection === "desc" ? 1 : -1

      return 0
    })

    setSortedReports(sorted)
  }, [localReports, sortDirection])

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => {
      const newValue = !prev
      if (newValue) {
        toast.success("Auto-refresh enabled")
      } else {
        toast.info("Auto-refresh disabled")
      }
      return newValue
    })
  }

  const getPropertyValue = (obj, prop) => {
    if (obj[prop] !== undefined) {
      return obj[prop]
    }

    const propLower = prop.toLowerCase()
    const keys = Object.keys(obj)

    for (const key of keys) {
      if (key.toLowerCase() === propLower) {
        return obj[key]
      }
    }

    return "N/A"
  }

  const isStatusCompleted = (report) => {
    const status = getPropertyValue(report, "status")
    return status && status.toLowerCase() === "completed"
  }

  const formatSampleSize = (report) => {
    const sampleSize = getPropertyValue(report, "sampleSize")
    if (sampleSize === "N/A" || sampleSize === null || sampleSize === undefined) {
      return "All"
    }
    return sampleSize.toString()
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A"
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase()
    if (statusLower === "completed") {
      return (
        <Badge className="bg-green-900/50 text-green-300 border-green-700/50 hover:bg-green-900/70">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-yellow-900/50 text-yellow-300 border-yellow-700/50">
        <Clock className="w-3 h-3 mr-1" />
        {status || "Processing"}
      </Badge>
    )
  }

  const handleDownload = (report) => {
    const url = getPropertyValue(report, "url")
    if (!url || url === "N/A") {
      toast.error("Download URL not available")
      return
    }
    onDownload(url)
    toast.success("Download started")
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const updatedReports = await onRefresh()
      setLocalReports(updatedReports || reports)
      toast.success("Reports updated successfully")
    } catch (error) {
      toast.error("Failed to update reports. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteClick = (report) => {
    setReportToDelete(report)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return

    try {
      const reportId = getPropertyValue(reportToDelete, "reportId")
      await onDelete(reportId)
      // La actualización se manejará vía SSE
    } catch (error) {
      toast.error("Failed to delete report")
    } finally {
      setIsDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 bg-muted/50" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-muted/30" />
          <Skeleton className="h-9 w-20 bg-muted/30" />
        </div>
      </div>
      <div className="border rounded-lg bg-card/50">
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full bg-muted/50 animate-shimmer" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold">Reports Dashboard</CardTitle>
            <Badge variant="outline" className="text-xs">
              {sortedReports.length} reports
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-2 hover:bg-accent/50 border-border/50 ${
                autoRefreshEnabled ? 'bg-primary/10 text-primary border-primary/30' : ''
              }`}
              title={autoRefreshEnabled ? "Auto-refresh enabled" : "Auto-refresh disabled"}
            >
              <Wifi className={`h-4 w-4 ${autoRefreshEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">
                Auto-refresh
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              className="flex items-center gap-2 hover:bg-accent/50 border-border/50"
              title={
                sortDirection === "desc"
                  ? "Sorted from newest to oldest"
                  : "Sorted from oldest to newest"
              }
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">
                {sortDirection === "desc" ? "Newest First" : "Oldest First"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 hover:bg-accent/50 border-border/50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : sortedReports.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="p-4 bg-muted/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No reports yet</h3>
              <p className="text-muted-foreground">
                Generate your first report by selecting a Pokémon type above.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30">
            <Table>
              <TableCaption className="bg-muted/20 text-muted-foreground py-3">
                List of Pokémon reports available for download
                {autoRefreshEnabled && (
                  <span className="ml-2 text-primary">• Live updates enabled</span>
                )}
              </TableCaption>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-muted/20">
                  <TableHead className="w-[100px] font-semibold">Report ID</TableHead>
                  <TableHead className="w-[120px] font-semibold">Status</TableHead>
                  <TableHead className="w-[150px] font-semibold">Type</TableHead>
                  <TableHead className="w-[120px] font-semibold">Sample Size</TableHead>
                  <TableHead className="w-[180px] font-semibold">Created</TableHead>
                  <TableHead className="w-[180px] font-semibold">Updated</TableHead>
                  <TableHead className="w-[120px] font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReports.map((report, index) => (
                  <TableRow 
                    key={getPropertyValue(report, "reportId") || index}
                    className="border-border/50 hover:bg-muted/10 transition-colors duration-150"
                  >
                    <TableCell className="font-mono text-sm">
                      #{getPropertyValue(report, "reportId")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(getPropertyValue(report, "status"))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(getPropertyValue(report, "pokemonType"))}`}></div>
                        <span className="capitalize font-medium">
                          {getPropertyValue(report, "pokemonType")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatSampleSize(report)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(getPropertyValue(report, "created_at"))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(getPropertyValue(report, "updated_at"))}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {isStatusCompleted(report) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDownload(report)} 
                            title="Download CSV"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors duration-150"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(report)}
                          title="Delete Report"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this report? This action cannot be undone and will permanently remove the report and its associated CSV file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-muted/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Helper function to get type-specific colors
function getTypeColor(typeName) {
  const typeColors = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-cyan-300',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-green-400',
    rock: 'bg-yellow-800',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
  }
  
  return typeColors[typeName?.toLowerCase()] || 'bg-primary'
}