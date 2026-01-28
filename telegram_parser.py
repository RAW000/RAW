"""
Telegram Views Parser для RAW Store
Читает просмотры постов из канала и обновляет products.json
"""

import os
import asyncio
import json

from telethon import TelegramClient
from telethon.sessions import StringSession

# Берём секреты из переменных окружения (GitHub Secrets)
API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
STRING_SESSION = os.environ["TG_STRING_SESSION"]

CHANNEL_USERNAME = "RAWSTORE111"

POST_IDS = {
    0: 41,
    1: 66,
    2: 56,
    3: 59,
    4: 53,
    5: 39,
    6: 45,
    7: 51
}

PRODUCTS_PATH = "products.json"

async def get_views():
    client = TelegramClient(StringSession(STRING_SESSION), API_ID, API_HASH)
    await client.start()

    channel = await client.get_entity(CHANNEL_USERNAME)

    views_data = {}
    for product_id, post_id in POST_IDS.items():
        try:
            msg = await client.get_messages(channel, ids=post_id)
            if msg and msg.views:
                views_data[product_id] = msg.views
                print(f"OK product={product_id} post={post_id} views={msg.views}")
            else:
                print(f"WARN product={product_id} post={post_id} no views")
        except Exception as e:
            print(f"ERR post={post_id}: {e}")

    await client.disconnect()
    return views_data

async def update_json(views_data):
    with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    for product_id, views in views_data.items():
        if product_id < len(products):
            products[product_id]["views"] = views

    with open(PRODUCTS_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print("DONE products.json updated")

async def main():
    views = await get_views()
    await update_json(views)

if __name__ == "__main__":
    asyncio.run(main())

