DROP VIEW `v_producer_cards`;--> statement-breakpoint
CREATE VIEW `v_producer_cards` AS select "producers"."id", "producers"."name", "producers"."type", "producers"."user_id", "producers"."verified", CASE WHEN "producers"."user_id" IS NOT NULL THEN 1 ELSE 0 END as "isClaimed", "producers"."subscription_rank", "producer_location"."latitude", "producer_location"."longitude", "producer_location"."locality", "producer_location"."admin_area", "producer_location"."country", "producers"."about", (
        SELECT COALESCE(
          json_extract("media_assets"."variants", '$.cover'),
          "media_assets"."url"
        )
        FROM "media_assets"
        WHERE "media_assets"."id" = (
          SELECT "producer_media"."asset_id"
          FROM "producer_media"
          WHERE "producer_media"."producer_id" = "producers"."id"
          ORDER BY ("producer_media"."role" = 'cover') DESC, "producer_media"."position" ASC
          LIMIT 1
        )
      ) as "thumbnailUrl", "producers_search"."search_labels" from "producers" left join "producer_location" on "producer_location"."producer_id" = "producers"."id" left join "producers_search" on "producers_search"."producer_id" = "producers"."id";