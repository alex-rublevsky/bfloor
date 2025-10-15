import { Link as RouterLink } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedGroup } from "~/components/motion_primitives/AnimatedGroup";
import { TextEffect } from "~/components/motion_primitives/AnimatedText";
import { Button } from "~/components/ui/shared/Button";
import { Image } from "~/components/ui/shared/Image";
import { Link } from "~/components/ui/shared/Link";
import NeumorphismCard from "~/components/ui/shared/NeumorphismCard";
import { useIsMobile } from "~/hooks/use-mobile";

function HeroSection() {
	const isMobile = useIsMobile();
	const [isSplineLoaded, setIsSplineLoaded] = useState(false);

	useEffect(() => {
		// Only load Spline on desktop
		if (!isMobile) {
			// Check if script is already loaded
			if (document.querySelector('script[src*="splinetool/viewer"]')) {
				setIsSplineLoaded(true);
				return;
			}

			// Create and load the script element
			const script = document.createElement("script");
			script.src =
				"https://unpkg.com/@splinetool/viewer@1.10.2/build/spline-viewer.js";
			script.type = "module";
			script.onload = () => {
				setIsSplineLoaded(true);
			};
			script.onerror = (error) => {
				console.error("Failed to load Spline viewer:", error);
			};

			document.head.appendChild(script);

			// Cleanup function to remove script if component unmounts
			return () => {
				const existingScript = document.querySelector(
					'script[src*="splinetool/viewer"]',
				);
				if (existingScript?.parentNode) {
					existingScript.parentNode.removeChild(existingScript);
				}
			};
		}
	}, [isMobile]);
	return (
		<section className="relative pb-20 lg:pb-0 min-h-screen md:min-h-[calc(100vh+5rem)] overflow-hidden">
			{/* Spline 3D Background - Only on desktop and when script is loaded */}
			{!isMobile && isSplineLoaded && (
				<motion.div
					className="absolute inset-0 w-full h-full z-0"
					initial={{ opacity: 0, filter: "blur(12px)" }}
					animate={{ opacity: 1, filter: "blur(0px)" }}
					transition={{
						delay: 1.75,
						duration: 2,
						type: "spring",
						bounce: 0.3,
						filter: { duration: 0.01, ease: "linear" },
					}}
				>
					{/* @ts-ignore */}
					<spline-viewer
						loading-anim-type="spinner-big-dark"
						url="https://prod.spline.design/XRydKQhqfpYOjapX/scene.splinecode"
						style={{
							width: "100%",
							height: "100%",
							zIndex: -1,
						}}
					/>

					{/* Bottom gradient overlay */}
					<div
						className="absolute bottom-0 left-0 right-0 pointer-events-none"
						style={{
							height: "9rem",
							background:
								"linear-gradient(to top, #F1F1F3 0%, #F1F1F3 44.44%, transparent 100%)",
						}}
					/>
				</motion.div>
			)}

			{/* Fallback Background - For mobile or when Spline isn't loaded */}
			{(isMobile || !isSplineLoaded) && (
				<div
					className="absolute inset-0 w-full h-full z-0"
					style={{
						background:
							"linear-gradient(135deg, #F1F1F3 0%, #E8E8EA 50%, #F1F1F3 100%)",
					}}
				/>
			)}

			{/* Content overlay */}
			<div className="relative z-10">
				<div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex top-2 mb-8 md:mb-12">
					<AnimatedGroup className="hidden md:flex gap-4">
						<Button asChild variant="outline">
							<RouterLink to="/" hash="#booking">
								Book a call
							</RouterLink>
						</Button>
						<Button asChild variant="outline">
							<RouterLink to="/" hash="#subscription">
								See pricing
							</RouterLink>
						</Button>
					</AnimatedGroup>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center justify-items-center min-h-[80dvh]">
					<div className="flex flex-col gap-4 mr-auto">
						<TextEffect speedSegment={0.3} as="h1" className="max-w-[15ch]">
							Design subscriptions for everyone
						</TextEffect>

						<TextEffect
							speedSegment={0.3}
							as="p"
							className="text-xl text-muted-foreground"
						>
							Pause or cancel anytime.
						</TextEffect>
					</div>

					<AnimatedGroup delay={0.75}>
						<NeumorphismCard className="size-fit mr-auto md:mx-auto !bg-background/80 z-[100]">
							<div className="flex flex-col gap-8">
								<div>
									<h3 className="max-w-[11ch] mb-4">Join Rublevsky Studio</h3>
									<Button size="lg" asChild className="w-full text-lg">
										<RouterLink to="/" hash="#subscription">
											See pricing
										</RouterLink>
									</Button>
								</div>
								<div className="flex gap-6">
									<div className="relative w-24 h-24">
										<div className="absolute inset-0 overflow-hidden rounded-full aspect-square transition-all duration-500">
											<Image
												src="/me.jpg"
												alt="Profile picture"
												width={96}
												height={96}
												quality={90}
												className="w-full h-full object-cover object-top transition-all duration-500 scale-200 origin-top"
											/>
										</div>
									</div>
									<div>
										<div className="flex flex-col justify-center gap-2">
											<h5>Book a 15-min call</h5>
											<Link
												href="#booking"
												className="blurLink text-muted-foreground "
												cursorType="small"
											>
												Schedule now →
											</Link>
										</div>
									</div>
								</div>
								<div>
									<div className="flex gap-6">
										<h5>
											<Link href="mailto:alexander@rublevsky.studio">
												Email
											</Link>
										</h5>
										<h5>
											<Link href="https://t.me/alexrublevsky" target="_blank">
												Telegram
											</Link>
										</h5>
									</div>
								</div>
							</div>
						</NeumorphismCard>
					</AnimatedGroup>
				</div>
			</div>
		</section>
	);
}

export default HeroSection;
