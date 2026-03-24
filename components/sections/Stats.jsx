"use client";

import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useAnimation } from "framer-motion";
import { CountUp } from "use-count-up";

const stats = [
	{
		value: 5,
		label: "Years in Experience",
	},
	{
		value: 50,
		label: "Happy Clients",
	},
	{
		value: 15,
		label: "Team Members",
	},
	{
		value: 10,
		label: "Awards Won",
	},
	{
		value: 30,
		label: "Brands Built",
	},
];

const StatItem = ({ stat, index }) => {
	const controls = useAnimation();
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	useEffect(() => {
		if (inView) {
			controls.start("visible");
		}
	}, [controls, inView]);

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: 0.5, delay: index * 0.1 },
				},
			}}
			className="flex flex-col items-center"
		>
			<h3 className="text-3xl sm:text-4xl font-bold text-foreground">
				<CountUp isCounting end={stat.value} duration={2.5} />+
			</h3>
			<p className="text-sm sm:text-base text-muted-foreground mt-2">
				{stat.label}
			</p>
		</motion.div>
	);
};

export default function StatsSection() {
	return (
		<section className="py-16 sm:py-20 bg-black">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-4 text-center">
					{stats.map((stat, index) => (
						<StatItem key={index} stat={stat} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
