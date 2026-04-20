import configparser
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_Session = None
_engine = None


def init_db(config: configparser.ConfigParser):
    global _engine, _Session
    url = config.get('database', 'url', fallback=None) or os.getenv('DATABASE_URL')
    if not url:
        raise RuntimeError('Database URL not set. Add [database] url to config.ini or set DATABASE_URL env var.')
    _engine = create_engine(url)
    _Session = sessionmaker(bind=_engine, autobegin=True)


def get_session():
    if _Session is None:
        raise RuntimeError('Database not initialised. Call init_db() first.')
    return _Session()
