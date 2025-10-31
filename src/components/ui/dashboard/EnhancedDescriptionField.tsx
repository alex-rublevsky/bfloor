import React, { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/dashboard/tabs";
import ReactMarkdown from "react-markdown";
import { markdownComponents, rehypePlugins } from "~/components/ui/shared/MarkdownComponents";
import { 
	formatContentForDisplay, 
	formatContentForEditing, 
	validateContent
} from "~/utils/contentUtils";

interface EnhancedDescriptionFieldProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	variant?: "default" | "large";
	/** Whether to show preview tabs */
	showPreview?: boolean;
	/** Whether to show formatting help */
	showHelp?: boolean;
	/** Whether to auto-clean content on load */
	autoClean?: boolean;
	/** Callback when content validation changes */
	onValidationChange?: (validation: { isValid: boolean; issues: string[]; suggestions: string[] }) => void;
}

/**
 * Enhanced description field with HTML/Markdown editing and preview capabilities
 * Supports both HTML and Markdown content with live preview
 */
export const EnhancedDescriptionField = React.forwardRef<
	HTMLTextAreaElement,
	EnhancedDescriptionFieldProps
>(({ 
	className, 
	label = "Описание", 
	variant = "default", 
	showPreview = true,
	showHelp = true,
	autoClean = true,
	onValidationChange,
	value,
	onChange,
	...props 
}, ref) => {
	const id = React.useId();
	const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
	const [validation, setValidation] = useState<{ isValid: boolean; issues: string[]; suggestions: string[] }>({
		isValid: true,
		issues: [],
		suggestions: []
	});

	// Calculate height based on variant
	const heightClass = variant === "large" ? "min-h-[180px]" : "min-h-[150px]";

	// Clean content on mount if autoClean is enabled
	useEffect(() => {
		if (autoClean && value && typeof value === 'string') {
			const cleanedValue = formatContentForEditing(value);
			if (cleanedValue !== value) {
				// Trigger onChange with cleaned content
				onChange?.({
					target: { name: props.name, value: cleanedValue }
				} as React.ChangeEvent<HTMLTextAreaElement>);
			}
		}
	}, [autoClean, value, onChange, props.name]); // Include all dependencies

	// Validate content whenever it changes
	useEffect(() => {
		if (value && typeof value === 'string') {
			const newValidation = validateContent(value);
			setValidation(newValidation);
			onValidationChange?.(newValidation);
		}
	}, [value, onValidationChange]);

	// Handle content changes with cleaning
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange?.(e);
	};

	// Formatting help content
	const formattingHelp = (
		<div className="text-xs text-muted-foreground space-y-1">
			<div className="space-y-1">
				<div><strong>Markdown:</strong> **жирный**, *курсив*, [ссылка](url)</div>
				<div><strong>HTML:</strong> &lt;div&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;</div>
				<div><strong>Списки:</strong> - элемент или 1. элемент</div>
				<div><strong>Перенос строки:</strong> \n\n для нового абзаца</div>
			</div>
			
			{validation.issues.length > 0 && (
				<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
					<div className="font-medium">Проблемы:</div>
					<ul className="list-disc list-inside mt-1">
						{validation.issues.map((issue) => (
							<li key={issue}>{issue}</li>
						))}
					</ul>
				</div>
			)}
			{validation.suggestions.length > 0 && (
				<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
					<div className="font-medium">Предложения:</div>
					<ul className="list-disc list-inside mt-1">
						{validation.suggestions.map((suggestion) => (
							<li key={suggestion}>{suggestion}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);

	return (
		<div className="space-y-2">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium mb-1">
					{label}
				</label>
			)}
			
			{showPreview ? (
				<Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "edit" | "preview")}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="edit">Редактировать</TabsTrigger>
						<TabsTrigger value="preview">Предпросмотр</TabsTrigger>
					</TabsList>
					
					<TabsContent value="edit" className="space-y-2">
						<textarea
							id={id}
							className={cn(
								"flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y font-mono field-sizing-content",
								heightClass,
								className,
							)}
							ref={ref}
							data-vaul-no-drag=""
							value={value}
							onChange={handleChange}
							{...props}
						/>
						{showHelp && formattingHelp}
					</TabsContent>
					
					<TabsContent value="preview" className="space-y-2">
						<div className={cn(
							"border border-input rounded-md p-3 bg-background",
							heightClass
						)}>
							<div className="prose max-w-none">
								<ReactMarkdown
									components={markdownComponents}
									rehypePlugins={rehypePlugins}
								>
									{formatContentForDisplay(value as string || "*Нет содержимого для предпросмотра*")}
								</ReactMarkdown>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			) : (
				<div className="space-y-2">
					<textarea
						id={id}
						className={cn(
							"flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y field-sizing-content",
							heightClass,
							className,
						)}
						ref={ref}
						data-vaul-no-drag=""
						value={value}
						onChange={handleChange}
						{...props}
					/>
					{showHelp && formattingHelp}
				</div>
			)}
		</div>
	);
});

EnhancedDescriptionField.displayName = "EnhancedDescriptionField";
