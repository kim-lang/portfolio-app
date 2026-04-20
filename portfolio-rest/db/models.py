from sqlalchemy import Boolean, Column, Date, DateTime, Double, Integer, Numeric, String
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


class PortfolioSnapshot(Base):
    __tablename__ = 'portfolio_snapshots'

    id         = Column(Integer, primary_key=True, autoincrement=True)
    date       = Column(Date, nullable=False, unique=True)
    value      = Column(Double, nullable=False)
    cost_basis = Column(Double, nullable=False)

    def to_dict(self):
        return {
            'date':       self.date.isoformat(),
            'value':      self.value,
            'cost_basis': self.cost_basis,
        }


class PortfolioView(Base):
    __tablename__ = 'portfolio'
    __table_args__ = {'info': {'is_view': True}}

    symbol     = Column(String(10), primary_key=True)
    shares     = Column(Numeric(precision=18, scale=8))
    avg_price  = Column(Double)
    total_cost = Column(Double)

    def to_dict(self):
        return {
            'symbol':     self.symbol,
            'shares':     float(self.shares),
            'avg_price':  float(self.avg_price),
            'total_cost': float(self.total_cost),
        }
