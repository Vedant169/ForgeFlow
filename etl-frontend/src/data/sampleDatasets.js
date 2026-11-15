/**
 * sampleDatasets.js
 * 
 * Realistic, deeply nested multi-level JSON payloads matching the Capstone
 * Synopsis use cases:
 * 1. Zomato / Swiggy Real-Time City Logistics & Delivery Telemetry (Chapter 3.1)
 * 2. High-Frequency Crypto / Financial Market Feeds
 * 3. E-Commerce Enterprise Fulfillment & Multi-Store Orders
 * 4. Kubernetes Cluster Microservice Telemetry
 * 5. Global Meteorological Timeseries Stream
 */

export const SAMPLE_DATASETS = [
  {
    id: 'zomato-logistics',
    name: 'Swiggy / Zomato City Delivery Fleet (Case Study)',
    category: 'Logistics & Urban Operations',
    description: 'Deeply nested food delivery telemetry: kitchen prep delays, rider GPS coordinates, surge multipliers, and customer SLAs across metropolitan zones.',
    method: 'GET',
    url: 'https://dummyjson.com/users?limit=10',
    liveUrl: 'https://dummyjson.com/users?limit=10',
    data: {
      timestamp: "2026-10-21T02:45:00.000Z",
      region: {
        metro_hub: "Delhi-NCR",
        zone_code: "DEL-NCR-NORTH-04",
        dispatch_center: {
          center_id: "DC-9021",
          active_fleet_count: 142,
          surge_pricing: {
            is_active: true,
            surge_multiplier: 1.45,
            reason: "High order density & localized drizzle"
          }
        }
      },
      orders: [
        {
          order_id: "ORD-98421",
          placed_at: "2026-10-21T02:15:32.000Z",
          status: "IN_TRANSIT",
          financials: {
            cart_subtotal: 749.50,
            delivery_fee: 45.00,
            surge_charge: 35.00,
            discount: 50.00,
            final_payout: 779.50
          },
          restaurant: {
            restaurant_id: "REST-348",
            name: "Punjab Grill Express",
            cuisine_types: ["North Indian", "Mughlai", "Biryani"],
            kitchen_prep: {
              target_minutes: 18,
              actual_minutes: 24,
              delay_minutes: 6
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-8812",
              name: "Amit Sharma",
              vehicle_type: "EV_SCOOTER",
              battery_pct: 78,
              gps_location: {
                lat: 28.5355,
                lng: 77.3910,
                speed_kmh: 34.2
              }
            },
            transit_metrics: {
              distance_km: 4.8,
              estimated_arrival_minutes: 9,
              customer_rating_estimate: 4.8
            }
          }
        },
        {
          order_id: "ORD-98422",
          placed_at: "2026-10-21T02:18:10.000Z",
          status: "PREPARING",
          financials: {
            cart_subtotal: 1220.00,
            delivery_fee: 55.00,
            surge_charge: 40.00,
            discount: 100.00,
            final_payout: 1215.00
          },
          restaurant: {
            restaurant_id: "REST-912",
            name: "Pizza Uno Artisanal",
            cuisine_types: ["Italian", "Gourmet Pizza"],
            kitchen_prep: {
              target_minutes: 22,
              actual_minutes: 21,
              delay_minutes: 0
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-9043",
              name: "Rajesh Kumar",
              vehicle_type: "PETROL_BIKE",
              battery_pct: null,
              gps_location: {
                lat: 28.5412,
                lng: 77.4018,
                speed_kmh: 18.5
              }
            },
            transit_metrics: {
              distance_km: 6.2,
              estimated_arrival_minutes: 16,
              customer_rating_estimate: 4.9
            }
          }
        },
        {
          order_id: "ORD-98423",
          placed_at: "2026-10-21T02:22:45.000Z",
          status: "DELIVERED",
          financials: {
            cart_subtotal: 390.00,
            delivery_fee: 30.00,
            surge_charge: 0.00,
            discount: 0.00,
            final_payout: 420.00
          },
          restaurant: {
            restaurant_id: "REST-105",
            name: "Chai & Samosa Point",
            cuisine_types: ["Beverages", "Street Snacks"],
            kitchen_prep: {
              target_minutes: 8,
              actual_minutes: 10,
              delay_minutes: 2
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-4421",
              name: "Vikas Verma",
              vehicle_type: "EV_SCOOTER",
              battery_pct: 42,
              gps_location: {
                lat: 28.5290,
                lng: 77.3850,
                speed_kmh: 0.0
              }
            },
            transit_metrics: {
              distance_km: 2.1,
              estimated_arrival_minutes: 0,
              customer_rating_estimate: 5.0
            }
          }
        },
        {
          order_id: "ORD-98424",
          placed_at: "2026-10-21T02:25:00.000Z",
          status: "IN_TRANSIT",
          financials: {
            cart_subtotal: 1850.00,
            delivery_fee: 65.00,
            surge_charge: 50.00,
            discount: 150.00,
            final_payout: 1815.00
          },
          restaurant: {
            restaurant_id: "REST-504",
            name: "Barbeque Nation Buffet",
            cuisine_types: ["Barbeque", "North Indian"],
            kitchen_prep: {
              target_minutes: 30,
              actual_minutes: 38,
              delay_minutes: 8
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-7729",
              name: "Deepak Rawat",
              vehicle_type: "EV_SCOOTER",
              battery_pct: 91,
              gps_location: {
                lat: 28.5520,
                lng: 77.4120,
                speed_kmh: 41.0
              }
            },
            transit_metrics: {
              distance_km: 8.5,
              estimated_arrival_minutes: 22,
              customer_rating_estimate: 4.7
            }
          }
        },
        {
          order_id: "ORD-98425",
          placed_at: "2026-10-21T02:28:15.000Z",
          status: "PREPARING",
          financials: {
            cart_subtotal: 620.00,
            delivery_fee: 40.00,
            surge_charge: 25.00,
            discount: 40.00,
            final_payout: 645.00
          },
          restaurant: {
            restaurant_id: "REST-209",
            name: "Wok in the Clouds",
            cuisine_types: ["Asian", "Noodles"],
            kitchen_prep: {
              target_minutes: 15,
              actual_minutes: 16,
              delay_minutes: 1
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-6531",
              name: "Suresh Mehra",
              vehicle_type: "PETROL_BIKE",
              battery_pct: null,
              gps_location: {
                lat: 28.5310,
                lng: 77.3980,
                speed_kmh: 22.4
              }
            },
            transit_metrics: {
              distance_km: 3.4,
              estimated_arrival_minutes: 11,
              customer_rating_estimate: 4.6
            }
          }
        },
        {
          order_id: "ORD-98426",
          placed_at: "2026-10-21T02:31:40.000Z",
          status: "IN_TRANSIT",
          financials: {
            cart_subtotal: 980.00,
            delivery_fee: 45.00,
            surge_charge: 35.00,
            discount: 80.00,
            final_payout: 980.00
          },
          restaurant: {
            restaurant_id: "REST-771",
            name: "Subway Fresh Daily",
            cuisine_types: ["Healthy", "Sandwiches"],
            kitchen_prep: {
              target_minutes: 12,
              actual_minutes: 14,
              delay_minutes: 2
            }
          },
          fulfillment: {
            rider: {
              rider_id: "RID-8812",
              name: "Amit Sharma",
              vehicle_type: "EV_SCOOTER",
              battery_pct: 71,
              gps_location: {
                lat: 28.5410,
                lng: 77.3990,
                speed_kmh: 29.8
              }
            },
            transit_metrics: {
              distance_km: 4.1,
              estimated_arrival_minutes: 8,
              customer_rating_estimate: 4.9
            }
          }
        }
      ]
    }
  },

  {
    id: 'crypto-market',
    name: 'Crypto Liquidity & Order Book Telemetry',
    category: 'Financial Market Feeds',
    description: 'High frequency crypto assets: prices, 24h volume, price change percentage, market capitalization, depth ratios, and technical indicators.',
    method: 'GET',
    url: 'https://api.coinlore.net/api/tickers/?start=0&limit=6',
    liveUrl: 'https://api.coinlore.net/api/tickers/?start=0&limit=6',
    data: {
      feed_timestamp: "2026-10-21T02:50:00.000Z",
      exchange: "GlobalLiquid-Spot",
      total_active_pairs: 6,
      tokens: [
        {
          symbol: "BTC",
          name: "Bitcoin",
          pricing: {
            current_price_usd: 84320.50,
            high_24h: 85900.00,
            low_24h: 82750.00,
            change_24h_pct: 1.88
          },
          liquidity: {
            volume_24h_usd: 28450120000,
            order_book: {
              bid_ask_spread_pct: 0.012,
              depth_score: 98.4
            }
          },
          indicators: {
            rsi_14: 64.2,
            moving_avg_50d: 79800.00,
            volatility_index: 2.45
          }
        },
        {
          symbol: "ETH",
          name: "Ethereum",
          pricing: {
            current_price_usd: 3940.20,
            high_24h: 4050.00,
            low_24h: 3820.00,
            change_24h_pct: 3.12
          },
          liquidity: {
            volume_24h_usd: 14200500000,
            order_book: {
              bid_ask_spread_pct: 0.018,
              depth_score: 95.1
            }
          },
          indicators: {
            rsi_14: 69.8,
            moving_avg_50d: 3610.00,
            volatility_index: 3.10
          }
        },
        {
          symbol: "SOL",
          name: "Solana",
          pricing: {
            current_price_usd: 218.45,
            high_24h: 226.00,
            low_24h: 209.50,
            change_24h_pct: 4.25
          },
          liquidity: {
            volume_24h_usd: 6800200000,
            order_book: {
              bid_ask_spread_pct: 0.024,
              depth_score: 89.6
            }
          },
          indicators: {
            rsi_14: 72.1,
            moving_avg_50d: 192.50,
            volatility_index: 4.80
          }
        },
        {
          symbol: "AVAX",
          name: "Avalanche",
          pricing: {
            current_price_usd: 48.60,
            high_24h: 51.20,
            low_24h: 47.10,
            change_24h_pct: -0.95
          },
          liquidity: {
            volume_24h_usd: 940300000,
            order_book: {
              bid_ask_spread_pct: 0.035,
              depth_score: 81.3
            }
          },
          indicators: {
            rsi_14: 51.4,
            moving_avg_50d: 46.80,
            volatility_index: 3.90
          }
        },
        {
          symbol: "DOT",
          name: "Polkadot",
          pricing: {
            current_price_usd: 9.85,
            high_24h: 10.30,
            low_24h: 9.40,
            change_24h_pct: 2.15
          },
          liquidity: {
            volume_24h_usd: 450120000,
            order_book: {
              bid_ask_spread_pct: 0.041,
              depth_score: 77.8
            }
          },
          indicators: {
            rsi_14: 55.6,
            moving_avg_50d: 9.20,
            volatility_index: 3.40
          }
        },
        {
          symbol: "LINK",
          name: "Chainlink",
          pricing: {
            current_price_usd: 24.30,
            high_24h: 25.10,
            low_24h: 23.40,
            change_24h_pct: 3.84
          },
          liquidity: {
            volume_24h_usd: 810450000,
            order_book: {
              bid_ask_spread_pct: 0.029,
              depth_score: 86.2
            }
          },
          indicators: {
            rsi_14: 66.4,
            moving_avg_50d: 21.90,
            volatility_index: 3.75
          }
        }
      ]
    }
  },

  {
    id: 'k8s-cluster',
    name: 'Kubernetes Cluster & Microservice Metrics',
    category: 'Cloud Telemetry & DevOps',
    description: 'Infrastructure health telemetry across containerized microservices: CPU cores, memory footprints, pod restart counts, and network request latencies.',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.209&hourly=temperature_2m,precipitation,windspeed_10m,cloudcover&forecast_days=3&timezone=Asia%2FKolkata',
    liveUrl: 'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.209&hourly=temperature_2m,precipitation,windspeed_10m,cloudcover&forecast_days=3&timezone=Asia%2FKolkata',
    data: {
      cluster_id: "gcp-cloud-run-k8s-prod-01",
      scraped_at: "2026-10-21T02:40:00.000Z",
      metrics: [
        {
          service: "auth-gateway",
          pod_id: "auth-gw-6d8bf-x9p",
          node_host: "worker-node-alpha",
          resources: {
            cpu_millicores: 340,
            memory_mb: 512,
            memory_limit_mb: 1024,
            utilization_pct: 50.0
          },
          health: {
            status: "Running",
            restart_count: 0,
            uptime_hours: 312
          },
          traffic: {
            requests_per_sec: 1420,
            p99_latency_ms: 18.5,
            error_rate_pct: 0.02
          }
        },
        {
          service: "etl-transformer-engine",
          pod_id: "etl-dfs-79f8c-m4v",
          node_host: "worker-node-beta",
          resources: {
            cpu_millicores: 880,
            memory_mb: 1420,
            memory_limit_mb: 2048,
            utilization_pct: 69.3
          },
          health: {
            status: "Running",
            restart_count: 1,
            uptime_hours: 94
          },
          traffic: {
            requests_per_sec: 460,
            p99_latency_ms: 42.1,
            error_rate_pct: 0.05
          }
        },
        {
          service: "order-stream-processor",
          pod_id: "order-strm-88cc1-k1w",
          node_host: "worker-node-gamma",
          resources: {
            cpu_millicores: 620,
            memory_mb: 890,
            memory_limit_mb: 1536,
            utilization_pct: 57.9
          },
          health: {
            status: "Running",
            restart_count: 0,
            uptime_hours: 215
          },
          traffic: {
            requests_per_sec: 980,
            p99_latency_ms: 24.3,
            error_rate_pct: 0.01
          }
        },
        {
          service: "bi-chart-renderer",
          pod_id: "bi-viz-45ee9-q2z",
          node_host: "worker-node-alpha",
          resources: {
            cpu_millicores: 410,
            memory_mb: 630,
            memory_limit_mb: 1024,
            utilization_pct: 61.5
          },
          health: {
            status: "Running",
            restart_count: 0,
            uptime_hours: 180
          },
          traffic: {
            requests_per_sec: 810,
            p99_latency_ms: 12.8,
            error_rate_pct: 0.00
          }
        },
        {
          service: "notification-dispatcher",
          pod_id: "notif-dp-12aa3-p8t",
          node_host: "worker-node-delta",
          resources: {
            cpu_millicores: 190,
            memory_mb: 320,
            memory_limit_mb: 512,
            utilization_pct: 62.5
          },
          health: {
            status: "Running",
            restart_count: 0,
            uptime_hours: 430
          },
          traffic: {
            requests_per_sec: 320,
            p99_latency_ms: 8.2,
            error_rate_pct: 0.01
          }
        }
      ]
    }
  },

  {
    id: 'ecommerce-orders',
    name: 'Omnichannel E-Commerce Revenue & Fulfillment',
    category: 'Retail & Commercial BI',
    description: 'Enterprise retail transaction records: customer segments, SKU volume, discounts applied, taxes, gross margin %, and regional fulfillment hubs.',
    method: 'GET',
    url: 'https://dummyjson.com/products?limit=20',
    liveUrl: 'https://dummyjson.com/products?limit=20',
    data: {
      generated_at: "2026-10-21T03:00:00.000Z",
      store_network: "OmniStore-Global",
      items: [
        {
          order_code: "ORD-USA-1001",
          order_date: "2026-10-20T10:14:00Z",
          channel: "Mobile App",
          customer: {
            tier: "Platinum VIP",
            lifetime_purchases: 42,
            country: "United States"
          },
          financials: {
            gross_revenue: 489.90,
            item_count: 3,
            discount_pct: 15.0,
            tax_amount: 39.19,
            net_profit: 142.50
          },
          shipping: {
            hub: "Chicago-Central",
            carrier: "FedEx Express",
            sla_days: 2,
            delayed: false
          }
        },
        {
          order_code: "ORD-DEU-2045",
          order_date: "2026-10-20T11:45:00Z",
          channel: "Desktop Web",
          customer: {
            tier: "Gold Member",
            lifetime_purchases: 18,
            country: "Germany"
          },
          financials: {
            gross_revenue: 310.00,
            item_count: 2,
            discount_pct: 10.0,
            tax_amount: 58.90,
            net_profit: 85.20
          },
          shipping: {
            hub: "Frankfurt-South",
            carrier: "DHL Priority",
            sla_days: 3,
            delayed: false
          }
        },
        {
          order_code: "ORD-IND-3088",
          order_date: "2026-10-20T13:20:00Z",
          channel: "Mobile App",
          customer: {
            tier: "Platinum VIP",
            lifetime_purchases: 64,
            country: "India"
          },
          financials: {
            gross_revenue: 890.00,
            item_count: 5,
            discount_pct: 20.0,
            tax_amount: 160.20,
            net_profit: 265.00
          },
          shipping: {
            hub: "Delhi-Faridabad",
            carrier: "BlueDart Air",
            sla_days: 1,
            delayed: false
          }
        },
        {
          order_code: "ORD-GBR-4012",
          order_date: "2026-10-20T14:05:00Z",
          channel: "Instagram Store",
          customer: {
            tier: "Silver Tier",
            lifetime_purchases: 5,
            country: "United Kingdom"
          },
          financials: {
            gross_revenue: 145.50,
            item_count: 1,
            discount_pct: 5.0,
            tax_amount: 29.10,
            net_profit: 42.00
          },
          shipping: {
            hub: "London-Heathrow",
            carrier: "Royal Mail Tracked",
            sla_days: 3,
            delayed: true
          }
        },
        {
          order_code: "ORD-JPN-5120",
          order_date: "2026-10-20T15:30:00Z",
          channel: "Desktop Web",
          customer: {
            tier: "Gold Member",
            lifetime_purchases: 22,
            country: "Japan"
          },
          financials: {
            gross_revenue: 620.00,
            item_count: 4,
            discount_pct: 12.0,
            tax_amount: 62.00,
            net_profit: 190.00
          },
          shipping: {
            hub: "Tokyo-East",
            carrier: "Yamato Transport",
            sla_days: 2,
            delayed: false
          }
        }
      ]
    }
  }
];
