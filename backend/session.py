from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings

# Cria o motor de conexão assíncrono usando a URL gerada no config.py
engine = create_async_engine(
    settings.database_url,
    echo=False,
)

# Fábrica de sessões do SQLAlchemy
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session