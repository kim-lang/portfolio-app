from sqlalchemy import Boolean, Column, DateTime, Double, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Transaction(Base):
    __tablename__ = 'transactions'

    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    symbol         = Column(String(10), nullable=False)
    date           = Column(DateTime(timezone=True), nullable=False)
    buy            = Column(Boolean, nullable=False)
    price          = Column(Double, nullable=False)
    shares         = Column(Numeric(precision=18, scale=8), nullable=False)

    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'symbol':         self.symbol,
            'date':           self.date.isoformat(),
            'buy':            self.buy,
            'price':          self.price,
            'shares':         float(self.shares),
        }
