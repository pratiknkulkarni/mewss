package main

import (
	"feedscheduler/internal/config"
	"fmt"
	"log"
)

func main() {
	//TODO:
	//THIS IS A TEST FILE, I MAY DELETE THIS LATER ON
	//JUST CHECKING IF THE CONFIG WORKS
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	fmt.Printf("Starting Scheduler in %s mode\n", cfg.AppEnv)
}
