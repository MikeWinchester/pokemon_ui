import settings from "@/lib/settings";

export async function getReports() {
    try {
      const response = await fetch(`${settings.URL}/request`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response (GET):", data)

      return Array.isArray(data) ? data : data.results || data.data || []
    } catch (error) {
      console.error("Error fetching reports:", error)
      throw error
    }
}

export async function createReport(requestData) {
    try {
      // Validar que sea un objeto o convertir si es string
      const payload = typeof requestData === 'string' 
        ? { pokemon_type: requestData } 
        : requestData

      console.log("Creating report with payload:", payload)

      const response = await fetch(`${settings.URL}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response (POST):", data)

      return data
    } catch (error) {
      console.error("Error creating report:", error)
      throw error
    }
}

export async function deleteReport(reportId) {
    try {
      const response = await fetch(`${settings.URL}/request/${reportId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response (DELETE):", data)

      return data
    } catch (error) {
      console.error("Error deleting report:", error)
      throw error
    }
}