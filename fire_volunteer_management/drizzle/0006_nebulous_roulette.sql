CREATE TABLE `deliveryPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`sequence` int NOT NULL,
	`recipientName` varchar(100) NOT NULL,
	`recipientPhone` varchar(20) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`specialInstructions` text,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryPoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskNumber` varchar(50) NOT NULL,
	`taskDate` timestamp NOT NULL,
	`volunteerId` int,
	`volunteerName` varchar(100),
	`status` enum('pending','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`totalPoints` int NOT NULL DEFAULT 0,
	`completedPoints` int NOT NULL DEFAULT 0,
	`startTime` timestamp,
	`completedTime` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveryTasks_taskNumber_unique` UNIQUE(`taskNumber`)
);
--> statement-breakpoint
ALTER TABLE `deliveryPoints` ADD CONSTRAINT `deliveryPoints_taskId_deliveryTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `deliveryTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveryTasks` ADD CONSTRAINT `deliveryTasks_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;