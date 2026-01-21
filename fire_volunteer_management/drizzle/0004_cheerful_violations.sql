CREATE TABLE `recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` text,
	`lineUserId` varchar(255),
	`lineDisplayName` varchar(100),
	`lineAuthorizedAt` timestamp,
	`preferredNotificationMethod` enum('line','sms','both') DEFAULT 'sms',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipients_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipients_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
ALTER TABLE `mealDeliveries` ADD `recipientId` int;--> statement-breakpoint
ALTER TABLE `mealDeliveries` ADD CONSTRAINT `mealDeliveries_recipientId_recipients_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `recipients`(`id`) ON DELETE no action ON UPDATE no action;