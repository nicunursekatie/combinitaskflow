import { pgTable, varchar, text, foreignKey, check, timestamp, date, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const projects = pgTable("projects", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
});

export const categories = pgTable("categories", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 50 }).notNull(),
});

export const tasks = pgTable("tasks", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	title: text().notNull(),
	dueDate: timestamp("due_date", { mode: "date" }),
	status: varchar({ length: 20 }).notNull(),
	parentId: varchar("parent_id", { length: 50 }),
	projectId: varchar("project_id", { length: 50 }),
	energyLevel: varchar("energy_level", { length: 10 }),
	activationEnergy: varchar("activation_energy", { length: 10 }),
}, (table) => {
	return {
		tasksParentIdFkey: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "tasks_parent_id_fkey"
		}).onDelete("cascade"),
		tasksProjectIdFkey: foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_fkey"
		}).onDelete("set null"),
		tasksEnergyLevelCheck: check("tasks_energy_level_check", sql`(energy_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])`),
		tasksActivationEnergyCheck: check("tasks_activation_energy_check", sql`(activation_energy)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])`),
	}
});

export const timeBlocks = pgTable("time_blocks", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	title: text().notNull(),
	startTime: varchar("start_time", { length: 10 }).notNull(),
	endTime: varchar("end_time", { length: 10 }).notNull(),
	date: date().notNull(),
	taskId: varchar("task_id", { length: 50 }),
}, (table) => {
	return {
		timeBlocksTaskIdFkey: foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "time_blocks_task_id_fkey"
		}).onDelete("cascade"),
	}
});

export const taskCategories = pgTable("task_categories", {
	taskId: varchar("task_id", { length: 50 }).notNull(),
	categoryId: varchar("category_id", { length: 50 }).notNull(),
}, (table) => {
	return {
		taskCategoriesTaskIdFkey: foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_categories_task_id_fkey"
		}).onDelete("cascade"),
		taskCategoriesCategoryIdFkey: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "task_categories_category_id_fkey"
		}).onDelete("cascade"),
		taskCategoriesPkey: primaryKey({ columns: [table.taskId, table.categoryId], name: "task_categories_pkey"}),
	}
});

import { relations } from "drizzle-orm/relations";

export const tasksRelations = relations(tasks, ({one, many}) => ({
	task: one(tasks, {
		fields: [tasks.parentId],
		references: [tasks.id],
		relationName: "tasks_parentId_tasks_id"
	}),
	tasks: many(tasks, {
		relationName: "tasks_parentId_tasks_id"
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	timeBlocks: many(timeBlocks),
	taskCategories: many(taskCategories),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	tasks: many(tasks),
}));

export const timeBlocksRelations = relations(timeBlocks, ({one}) => ({
	task: one(tasks, {
		fields: [timeBlocks.taskId],
		references: [tasks.id]
	}),
}));

export const taskCategoriesRelations = relations(taskCategories, ({one}) => ({
	task: one(tasks, {
		fields: [taskCategories.taskId],
		references: [tasks.id]
	}),
	category: one(categories, {
		fields: [taskCategories.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	taskCategories: many(taskCategories),
}));