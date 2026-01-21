ALTER TABLE `bookings` ADD `adultCount` int NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `childCount` int NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `arrivalTime` varchar(20);--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `purpose`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `specialNeeds`;