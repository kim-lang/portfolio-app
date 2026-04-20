import logging
from datetime import date
from db import get_session, PortfolioView, PortfolioSnapshot

logger = logging.getLogger(__name__)


def take_snapshot(provider):
    with get_session() as session:
        holdings = session.query(PortfolioView).all()

        if not holdings:
            logger.info('No holdings to snapshot')
            return

        total_value = 0.0
        total_cost = sum(h.total_cost for h in holdings)

        for h in holdings:
            quote = provider.get_quote(h.symbol)
            if quote:
                total_value += quote['price'] * float(h.shares)
            else:
                logger.warning('No quote for %s — using cost basis', h.symbol)
                total_value += h.avg_price * float(h.shares)

        today = date.today()
        snapshot = session.query(PortfolioSnapshot).filter_by(date=today).first()
        if snapshot:
            snapshot.value = total_value
            snapshot.cost_basis = total_cost
        else:
            session.add(PortfolioSnapshot(date=today, value=total_value, cost_basis=total_cost))

        session.commit()
        logger.info('Snapshot saved: date=%s value=%.2f cost_basis=%.2f', today, total_value, total_cost)
