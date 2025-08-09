"use client"

import { useState, useEffect } from "react"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from 'lucide-react'

import PokemonTypeSelector from "@/components/pokemon-type-selector"
import ReportsTable from "@/components/reports-table"
import { getPokemonTypes } from "@/services/pokemon-service"
import { getReports, createReport, deleteReport } from "@/services/report-service"

export default function PokemonReportsPage() {
  const [pokemonTypes, setPokemonTypes] = useState([])
  const [reports, setReports] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [creatingReport, setCreatingReport] = useState(false)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState("")
  const [sampleSize, setSampleSize] = useState("")

  // Cargar los tipos de Pokémon
  useEffect(() => {
    const loadPokemonTypes = async () => {
      try {
        setLoadingTypes(true)
        setError(null)
        const types = await getPokemonTypes()
        setPokemonTypes(types)
        setLoadingTypes(false)
      } catch (error) {
        console.error("Error loading Pokemon types:", error)
        setError("Error al cargar los tipos de Pokémon. Por favor, intenta de nuevo más tarde.")
        setLoadingTypes(false)
      }
    }

    loadPokemonTypes()
  }, [])

  // Función para cargar los reportes
  const loadReports = async () => {
    try {
      setLoadingReports(true)
      setError(null)
      const reportData = await getReports()
      setReports(reportData)
      setLoadingReports(false)
      return reportData
    } catch (error) {
      console.error("Error loading reports:", error)
      setError("Error al cargar los reportes. Por favor, intenta de nuevo más tarde.")
      setLoadingReports(false)
      throw error
    }
  }

  // Función para refrescar la tabla
  const handleRefreshTable = async () => {
    try {
      await loadReports()
      return true
    } catch (error) {
      throw error
    }
  }

  // Cargar los reportes al iniciar
  useEffect(() => {
    loadReports()
  }, [])

  // Validar el sample size
  const validateSampleSize = (value) => {
    if (value === "") return true // Permitir campo vacío
    const num = parseInt(value)
    return !isNaN(num) && num > 0 && num <= 10000 // Límite razonable
  }

  const handleSampleSizeChange = (e) => {
    const value = e.target.value
    if (value === "" || validateSampleSize(value)) {
      setSampleSize(value)
    }
  }

  // Función para capturar todos los Pokémon del tipo seleccionado
  const catchThemAll = async () => {
    if (!selectedType) return

    // Validar sample size antes de enviar
    if (sampleSize && !validateSampleSize(sampleSize)) {
      toast.error("El número máximo de registros debe ser un entero positivo.")
      return
    }

    try {
      setCreatingReport(true)

      // Preparar los datos para enviar
      const requestData = {
        pokemon_type: selectedType,
      }

      // Solo agregar sample_size si tiene un valor válido
      if (sampleSize && sampleSize.trim() !== "") {
        requestData.sample_size = parseInt(sampleSize)
      }

      // Crear un nuevo reporte usando la API
      await createReport(requestData)

      // Mostrar notificación de éxito
      const sampleText = sampleSize ? ` con máximo ${sampleSize} registros` : ""
      toast.success(`Se ha generado un nuevo reporte para el tipo ${selectedType}${sampleText}.`)

      // Refrescar la tabla para mostrar el nuevo reporte
      await loadReports()

      setCreatingReport(false)
    } catch (error) {
      console.error("Error creating report:", error)

      // Mostrar notificación de error
      toast.error("No se pudo crear el reporte. Por favor, intenta de nuevo.")

      setCreatingReport(false)
    }
  }

  // Función para descargar el CSV
  const handleDownloadCSV = (url) => {
    window.open(url, "_blank")
  }

  // Función para eliminar un reporte
  const handleDeleteReport = async (reportId) => {
    try {
      await deleteReport(reportId)
      // Actualizar la lista de reportes eliminando el reporte borrado
      setReports(prevReports => prevReports.filter(report => report.ReportId !== reportId))
      toast.success("Reporte eliminado correctamente")
    } catch (error) {
      console.error("Error deleting report:", error)
      toast.error("No se pudo eliminar el reporte. Por favor, intenta de nuevo.")
    }
  }

  const isLoading = loadingTypes || loadingReports

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Pokémon Reports Generator</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6">
            {/* Primera fila: Selector de tipo */}
            <div className="w-full">
              <Label htmlFor="pokemon-type" className="text-sm font-medium mb-2 block">
                Tipo de Pokémon
              </Label>
              <PokemonTypeSelector
                pokemonTypes={pokemonTypes}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                loading={loadingTypes}
              />
            </div>

            {/* Segunda fila: Sample size y botón */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-2/3">
                <Label htmlFor="sample-size" className="text-sm font-medium mb-2 block">
                  Número Máximo de Registros (opcional)
                </Label>
                <Input
                  id="sample-size"
                  type="number"
                  placeholder="Ej: 50, 100, 200..."
                  value={sampleSize}
                  onChange={handleSampleSizeChange}
                  min="1"
                  max="10000"
                  className="w-full"
                  disabled={isLoading || creatingReport}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para obtener todos los registros disponibles
                </p>
              </div>
              <div className="w-full md:w-1/3 flex flex-col justify-end">
                <Button
                  onClick={catchThemAll}
                  disabled={!selectedType || isLoading || creatingReport}
                  className="w-full font-bold h-10"
                >
                  {creatingReport ? "Creating..." : isLoading ? "Loading..." : "Catch them all!"}
                </Button>
              </div>
            </div>
          </div>

          <ReportsTable
            reports={reports}
            loading={loadingReports}
            onRefresh={handleRefreshTable}
            onDownload={handleDownloadCSV}
            onDelete={handleDeleteReport}
          />
        </CardContent>
      </Card>
    </div>
  )
}