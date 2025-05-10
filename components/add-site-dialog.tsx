"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Website {
  id: number
  name: string
  type: string
  url: string
  description: string
  followed: boolean
  lastUpdated: Date
  latestContent: {
    id: number
    title: string
    summary: string
    publishedAt: Date
    url: string
  }[]
}

interface AddSiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWebsite: (website: Omit<Website, "id" | "lastUpdated" | "latestContent">) => void
}

export function AddSiteDialog({ open, onOpenChange, onAddWebsite }: AddSiteDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    url: "",
    description: "",
    followed: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name.trim() || !formData.url.trim() || !formData.type.trim()) {
      return
    }

    // Ensure URL has protocol
    let url = formData.url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    // Extract domain name for the name if not provided
    let name = formData.name
    if (!name.trim()) {
      name = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    }

    onAddWebsite({
      ...formData,
      name,
      url,
    })

    // Reset form
    setFormData({
      name: "",
      type: "",
      url: "",
      description: "",
      followed: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a new website</DialogTitle>
            <DialogDescription>Enter the details of the website you want to follow.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="example.com"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Tech, Design, News, etc."
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Add Website</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
