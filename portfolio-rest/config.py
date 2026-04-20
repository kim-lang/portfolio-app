import configparser
import os

_config: configparser.ConfigParser | None = None


def load_config() -> configparser.ConfigParser:
    global _config
    if _config is None:
        _config = configparser.ConfigParser()
        _config.read(os.path.join(os.path.dirname(__file__), 'config.ini'))
    return _config
