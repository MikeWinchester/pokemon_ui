"use client"

import { useState, useEffect } from "react"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Zap, Sparkles, Wifi, WifiOff } from 'lucide-react'

import PokemonTypeSelector from "@/components/pokemon-type-selector"
import ReportsTable from "@/components/reports-table"
import ProgressBar from "@/components/ProgressBar"
import { getPokemonTypes } from "@/services/pokemon-service"
import { getReports, createReport, deleteReport } from "@/services/report-service"
import { ProgressProvider, useProgress } from "@/context/ProgressContext"

function PokemonReportsContent() {
  const [pokemonTypes, setPokemonTypes] = useState([])
  const [reports, setReports] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [creatingReport, setCreatingReport] = useState(false)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState("")
  const [sampleSize, setSampleSize] = useState("")
  const [activeReportId, setActiveReportId] = useState(null)

  const { progressData, connectionStatus } = useProgress()

  // Load Pokémon types
  useEffect(() => {
    const loadPokemonTypes = async () => {
      try {
        setLoadingTypes(true)
        setError(null)
        const types = await getPokemonTypes()
        setPokemonTypes(types)
      } catch (error) {
        console.error("Error loading Pokemon types:", error)
        setError("Failed to load Pokémon types. Please try again later.")
      } finally {
        setLoadingTypes(false)
      }
    }

    loadPokemonTypes()
  }, [])

  // Function to load reports
  const loadReports = async () => {
    try {
      setLoadingReports(true)
      setError(null)
      const reportData = await getReports()
      setReports(reportData)
      return reportData
    } catch (error) {
      console.error("Error loading reports:", error)
      setError("Failed to load reports. Please try again later.")
      setReports([])
      throw error
    } finally {
      setLoadingReports(false)
    }
  }

  // Load reports on start
  useEffect(() => {
    loadReports()
  }, [])

  // Function to refresh the table
  const handleRefreshTable = async () => {
    try {
      await loadReports()
      return true
    } catch (error) {
      throw error
    }
  }

  // Validate sample size
  const validateSampleSize = (value) => {
    if (value === "") return true
    const num = parseInt(value)
    return !isNaN(num) && num > 0 && num <= 10000
  }

  const handleSampleSizeChange = (e) => {
    const value = e.target.value
    if (value === "" || validateSampleSize(value)) {
      setSampleSize(value)
    }
  }

  // Function to catch all Pokémon of selected type
  const catchThemAll = async () => {
    if (!selectedType) {
      toast.error("Please select a Pokémon type")
      return
    }

    if (sampleSize && !validateSampleSize(sampleSize)) {
      toast.error("Maximum number of records must be a positive integer (1-10000).")
      return
    }

    try {
      setCreatingReport(true)
      setError(null)

      const requestData = {
        pokemon_type: selectedType,
        ...(sampleSize && { sample_size: parseInt(sampleSize) })
      }

      const result = await createReport(requestData)
      
      // Obtener el ID del reporte creado
      if (Array.isArray(result) && result.length > 0) {
        const reportId = result[0].id
        setActiveReportId(reportId)
        toast.success(`New report generated for ${selectedType} type${sampleSize ? ` (max ${sampleSize} records)` : ''}.`)
      }
      
      // Refresh reports para mostrar el nuevo reporte
      setTimeout(async () => {
        await loadReports()
        setCreatingReport(false)
      }, 1000)
      
    } catch (error) {
      console.error("Error creating report:", error)
      toast.error(error.message || "Failed to create report. Please try again.")
      setCreatingReport(false)
    }
  }

  const handleDownloadCSV = (url) => {
    window.open(url, "_blank")
  }

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteReport(reportId)
      setReports(prev => prev.filter(r => r.ReportId !== reportId))
      toast.success("Report deleted successfully")
      
      // Limpiar progreso si existe
      if (activeReportId === reportId) {
        setActiveReportId(null)
      }
    } catch (error) {
      console.error("Error deleting report:", error)
      toast.error("Failed to delete report. Please try again.")
    }
  }

  const isLoading = loadingTypes || loadingReports
  const hasActiveProgress = Object.keys(progressData).length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Pokémon Reports Generator
                </h1>
                <p className="text-muted-foreground mt-1">
                  Generate and download comprehensive Pokémon reports by type
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Badge variant="outline" className="text-green-300 border-green-700/50 bg-green-900/50">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live Updates
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-300 border-yellow-700/50 bg-yellow-900/50">
                  <WifiOff className="w-3 h-3 mr-1" />
                  {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Progress Bars for Active Reports */}
        {hasActiveProgress && (
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1 bg-blue-500/10 rounded">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              Active Reports
            </h2>
            <div className="grid gap-4">
              {Object.entries(progressData).map(([reportId, progress]) => (
                <ProgressBar key={reportId} reportId={parseInt(reportId)} />
              ))}
            </div>
          </div>
        )}

        {/* Generator Card */}
        <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Report Generator</CardTitle>
              </div>
              <Badge variant="outline" className="text-primary border-primary/50">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Pokémon Type Selection */}
              <div className="lg:col-span-1">
                <Label htmlFor="pokemon-type" className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <span className="text-primary">●</span>
                  Pokémon Type
                </Label>
                <div className="flex justify-center">
                  <PokemonTypeSelector
                    pokemonTypes={pokemonTypes}
                    selectedType={selectedType}
                    onTypeChange={setSelectedType}
                    loading={loadingTypes}
                  />
                </div>
              </div>

              {/* Sample Size Input */}
              <div className="lg:col-span-1">
                <Label htmlFor="sample-size" className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <span className="text-accent">●</span>
                  Maximum Records (optional)
                </Label>
                <div className="flex justify-center">
                  <Input
                    id="sample-size"
                    type="number"
                    placeholder="e.g., 50, 100, 200..."
                    value={sampleSize}
                    onChange={handleSampleSizeChange}
                    min="1"
                    max="10000"
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 w-full max-w-xs"
                    disabled={isLoading || creatingReport}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-center">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                  Leave empty to get all available records
                </p>
              </div>

              {/* Generate Button */}
              <div className="lg:col-span-1 flex flex-col justify-end">
                <div className="flex justify-center">
                  <Button
                    onClick={catchThemAll}
                    disabled={!selectedType || isLoading || creatingReport}
                    size="lg"
                    className="w-full max-w-xs h-12 font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg hover:shadow-primary/25"
                  >
                    {creatingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Catch Them All!
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <ReportsTable
            reports={reports || []}
            loading={loadingReports}
            onRefresh={handleRefreshTable}
            onDownload={handleDownloadCSV}
            onDelete={handleDeleteReport}
          />
        </Card>
      </div>
    </div>
  )
}

export default function PokemonReportsPage() {
  return (
    <ProgressProvider>
      <PokemonReportsContent />
    </ProgressProvider>
  )
}