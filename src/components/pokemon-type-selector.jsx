"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function PokemonTypeSelector({ pokemonTypes, selectedType, onTypeChange, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full bg-muted/50 animate-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 bg-muted/30" />
          <Skeleton className="h-6 w-20 bg-muted/30" />
          <Skeleton className="h-6 w-14 bg-muted/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="h-12 bg-background/50 border-border/50 hover:border-primary/50 focus:border-primary transition-all duration-200 shadow-sm">
          <SelectValue placeholder="Select a Pokémon type..." className="text-muted-foreground" />
        </SelectTrigger>
        <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50 shadow-2xl">
          {pokemonTypes.map((type) => (
            <SelectItem 
              key={type.name} 
              value={type.name}
              className="hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getTypeColor(type.name)}`}></div>
                <span className="capitalize font-medium">{type.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Type count info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          {pokemonTypes.length} types available
        </Badge>
        {selectedType && (
          <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30">
            {selectedType} selected
          </Badge>
        )}
      </div>
    </div>
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
