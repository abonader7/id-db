import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "zod";

const FormattSchema = z.object({
	title: z.string(),
	date: z.coerce.date(),
	description: z.string(),
	subject: z.string(),
	level: z.enum(["1", "2", "3", "4", "5"]),
	term: z.number().min(1).max(2),
	prof: z.string(),
	contributor: z.string(),
	tags: z.array(z.string()),
	language: z.enum(["ar", "en"]),
})

export type Formatt = z.infer<typeof FormattSchema>;

const docs = defineCollection({
	loader: docsLoader(),
	schema: docsSchema({
		extend: FormattSchema.transform((data) => {
			return {
				...data,
				dir: data.language === "ar" ? "rtl" : "ltr",
			};
		}),
	}),
});

export const collections = {
	docs,
};
