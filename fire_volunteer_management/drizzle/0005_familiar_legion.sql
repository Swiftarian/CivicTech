CREATE TABLE `groupBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingNumber` varchar(50) NOT NULL,
	`organizationName` varchar(200) NOT NULL,
	`organizationType` varchar(100),
	`contactName` varchar(100) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`contactEmail` varchar(320),
	`numberOfPeople` int NOT NULL,
	`visitDate` timestamp NOT NULL,
	`visitTime` varchar(50) NOT NULL,
	`purpose` text,
	`specialNeeds` text,
	`hasDisabilities` boolean DEFAULT false,
	`disabilityDetails` text,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupBookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `groupBookings_bookingNumber_unique` UNIQUE(`bookingNumber`)
);
--> statement-breakpoint
CREATE TABLE `individualBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingNumber` varchar(50) NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`contactEmail` varchar(320),
	`numberOfPeople` int NOT NULL,
	`visitDate` timestamp NOT NULL,
	`visitTime` varchar(50) NOT NULL,
	`purpose` text,
	`specialNeeds` text,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `individualBookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `individualBookings_bookingNumber_unique` UNIQUE(`bookingNumber`)
);
