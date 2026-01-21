CREATE TABLE `attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerId` int NOT NULL,
	`scheduleId` int,
	`checkInTime` timestamp,
	`checkOutTime` timestamp,
	`workHours` int,
	`location` varchar(200),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingNumber` varchar(50) NOT NULL,
	`type` enum('group','individual') NOT NULL,
	`userId` int,
	`contactName` varchar(100) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`contactEmail` varchar(320),
	`organizationName` varchar(200),
	`numberOfPeople` int NOT NULL,
	`visitDate` timestamp NOT NULL,
	`visitTime` varchar(20) NOT NULL,
	`purpose` text,
	`specialNeeds` text,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`assignedVolunteerId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingNumber_unique` UNIQUE(`bookingNumber`)
);
--> statement-breakpoint
CREATE TABLE `caseProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`step` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','in_progress','completed') NOT NULL,
	`updatedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(50) NOT NULL,
	`userId` int,
	`applicantName` varchar(100) NOT NULL,
	`applicantPhone` varchar(20) NOT NULL,
	`applicantEmail` varchar(320),
	`caseType` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`attachments` text,
	`status` enum('submitted','reviewing','processing','completed','rejected') NOT NULL DEFAULT 'submitted',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`currentStep` varchar(100),
	`estimatedCompletionDate` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `deliveryTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`speed` varchar(20),
	`accuracy` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerId` int NOT NULL,
	`scheduleId` int NOT NULL,
	`type` enum('leave','swap') NOT NULL,
	`targetVolunteerId` int,
	`reason` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mealDeliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryNumber` varchar(50) NOT NULL,
	`volunteerId` int,
	`recipientName` varchar(100) NOT NULL,
	`recipientPhone` varchar(20) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`deliveryDate` timestamp NOT NULL,
	`deliveryTime` varchar(20) NOT NULL,
	`mealType` varchar(100),
	`specialInstructions` text,
	`status` enum('pending','assigned','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`qrCode` varchar(200),
	`verificationCode` varchar(20),
	`startTime` timestamp,
	`deliveredTime` timestamp,
	`recipientSignature` text,
	`photo` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mealDeliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `mealDeliveries_deliveryNumber_unique` UNIQUE(`deliveryNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`relatedId` int,
	`relatedType` varchar(50),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerId` int NOT NULL,
	`shiftDate` timestamp NOT NULL,
	`shiftTime` varchar(50) NOT NULL,
	`shiftType` enum('morning','afternoon','fullday') NOT NULL,
	`status` enum('scheduled','completed','absent','leave') NOT NULL DEFAULT 'scheduled',
	`bookingId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeId` varchar(50),
	`department` varchar(100),
	`position` varchar(100),
	`skills` text,
	`availability` text,
	`totalHours` int DEFAULT 0,
	`status` enum('active','inactive','leave') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','volunteer','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_scheduleId_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_assignedVolunteerId_volunteers_id_fk` FOREIGN KEY (`assignedVolunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caseProgress` ADD CONSTRAINT `caseProgress_caseId_cases_id_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caseProgress` ADD CONSTRAINT `caseProgress_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cases` ADD CONSTRAINT `cases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cases` ADD CONSTRAINT `cases_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveryTracking` ADD CONSTRAINT `deliveryTracking_deliveryId_mealDeliveries_id_fk` FOREIGN KEY (`deliveryId`) REFERENCES `mealDeliveries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveRequests` ADD CONSTRAINT `leaveRequests_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveRequests` ADD CONSTRAINT `leaveRequests_scheduleId_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveRequests` ADD CONSTRAINT `leaveRequests_targetVolunteerId_volunteers_id_fk` FOREIGN KEY (`targetVolunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveRequests` ADD CONSTRAINT `leaveRequests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mealDeliveries` ADD CONSTRAINT `mealDeliveries_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_bookingId_bookings_id_fk` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `volunteers` ADD CONSTRAINT `volunteers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;