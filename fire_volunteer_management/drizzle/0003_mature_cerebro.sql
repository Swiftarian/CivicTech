CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(100),
	`subject` varchar(500) NOT NULL,
	`emailType` varchar(100) NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`bookingId` int,
	`isTest` boolean NOT NULL DEFAULT false,
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
