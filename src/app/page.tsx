"use client";
import Sort from "@/components/Sort";
import TraitAccordion from "@/components/TraitAccordion";
import React, { useState } from "react";
import NFTGallery from "@/components/NFTGallery";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
	DrawerClose,
} from "@/components/ui/drawer";
import { Filter, X } from "lucide-react";

export default function Home() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	return (
		<div className="flex flex-col md:flex-row w-full px-6 gap-8">
			{/* Mobile Filter Button */}
			<div className="fixed bottom-6 md:hidden flex flex-col gap-4 justify-end">
				<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
					<DrawerTrigger asChild>
						<Button className="flex w-full items-center gap-2 bg-primary-200 text-secondary-950 font-bold text-md uppercase py-6 hover:bg-drip-300">
							<Filter size={16} /> Filters
						</Button>
					</DrawerTrigger>

					<DrawerContent className="fixed bottom-0 left-0 right-0 h-[85vh] bg-secondary-950 p-4 rounded-t-md shadow-lg border-none scrollbar-custom">
						<div className="flex justify-between items-center mb-4 w-[90%] mx-auto">
							<h2 className="text-lg font-bold text-primary-200 uppercase">
								Filters
							</h2>
							<DrawerClose asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-primary-200"
									onClick={() => setIsDrawerOpen(false)}
								>
									<X size={20} />
								</Button>
							</DrawerClose>
						</div>

						<div className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] w-full px-4 mx-auto pb-8">
							<Sort />
							<div className="w-full h-0.5 bg-primary-200/20" />
							<TraitAccordion />
							<DrawerClose asChild>
								<Button
									variant="destructive"
									onClick={() => setIsDrawerOpen(false)}
									className="flex w-full items-center gap-2 bg-primary-200 text-secondary-950 font-bold text-md uppercase py-6 hover:bg-drip-300"
								>
									Close Filters
								</Button>
							</DrawerClose>
						</div>
					</DrawerContent>
				</Drawer>
			</div>

			{/* Sidebar for Desktop */}
			<div className="hidden md:flex flex-col items-center justify-start md:1/4 xl:w-1/5 p-2 rounded">
				<div className="flex flex-col items-center w-full gap-6">
					<Sort />
					<div className="w-full h-0.5 bg-primary-200/20" />
					<TraitAccordion />
				</div>
			</div>

			{/* NFT Gallery */}
			<div className="flex flex-col items-center justify-start w-full md:w-3/4 xl:w-4/5 bg-primary-200/10 p-4 rounded">
				<NFTGallery />
			</div>
		</div>
	);
}
