import React from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "../../(seller)/dashboard/data.json"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Page() {
  return (
      <ScrollArea>
        <div className="w-full h-[calc(100svh-4rem)]">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            {/* <DataTable data={data} /> */}
          </div>
        </div>
      </ScrollArea>
  )
}
