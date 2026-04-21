import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.chat_session import ChatSession, ChatMessage

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ChatSession).order_by(ChatSession.created_at.desc()).limit(1))
        latest_session = result.scalar_one_or_none()
        if not latest_session:
            print("No sessions found")
            return
            
        print(f"Latest Session ID: {latest_session.id}")
        
        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == latest_session.id)
            .order_by(ChatMessage.created_at.asc())
        )
        messages = result.scalars().all()
        for i, msg in enumerate(messages):
            print(f"[{i}] {msg.role.upper()} ({msg.model_used}): {msg.content[:50]}...")

asyncio.run(main())
