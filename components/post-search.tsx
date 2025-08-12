"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface PostSearchProps {
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
}

export interface SearchFilters {
  query: string
  category: string
  tag: string
}

export function PostSearch({ onSearch, loading }: PostSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all", // Updated default value
    tag: "all", // Updated default value
  })
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string; slug: string }>>([])

  useEffect(() => {
    fetchCategoriesAndTags()
  }, [])

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([fetch("/api/categories"), fetch("/api/tags")])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }
    } catch (error) {
      console.error("Error fetching categories and tags:", error)
    }
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const clearFilters = () => {
    const clearedFilters = { query: "", category: "", tag: "" }
    setFilters(clearedFilters)
    onSearch(clearedFilters)
  }

  const hasActiveFilters =
    filters.query || (filters.category && filters.category !== "all") || (filters.tag && filters.tag !== "all")

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search posts..."
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem> {/* Updated value prop */}
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.tag} onValueChange={(value) => setFilters((prev) => ({ ...prev, tag: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem> {/* Updated value prop */}
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.slug}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && <Badge variant="secondary">Search: "{filters.query}"</Badge>}
          {filters.category !== "all" && (
            <Badge variant="secondary">Category: {categories.find((c) => c.slug === filters.category)?.name}</Badge>
          )}
          {filters.tag !== "all" && (
            <Badge variant="secondary">Tag: {tags.find((t) => t.slug === filters.tag)?.name}</Badge>
          )}
        </div>
      )}
    </div>
  )
}
