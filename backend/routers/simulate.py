import numpy as np
from fastapi import APIRouter, Depends
from core.security import get_current_user
from models.models import User
from schemas.schemas import SimulateRequest, SimulateOut, ProjectionPoint

router = APIRouter()


def monte_carlo(net_worth: float, monthly_savings: float, annual_return: float, years: int, n_sims: int = 500):
    """Run Monte Carlo simulations and return percentile bands."""
    monthly_return = annual_return / 12
    monthly_vol = 0.04 / np.sqrt(12)  # ~4% annual vol
    results = np.zeros((n_sims, years * 12))

    for sim in range(n_sims):
        nw = net_worth
        for month in range(years * 12):
            r = np.random.normal(monthly_return, monthly_vol)
            nw = nw * (1 + r) + monthly_savings
            results[sim, month] = nw

    yearly_results = results[:, [11 + i * 12 for i in range(years)]]
    return yearly_results


@router.post("", response_model=SimulateOut)
def simulate(req: SimulateRequest, current_user: User = Depends(get_current_user)):
    yearly = monte_carlo(req.current_net_worth, req.monthly_savings, req.investment_return_rate, req.years)
    projections = []

    for y in range(req.years):
        p50 = float(np.percentile(yearly[:, y], 50))
        p10 = float(np.percentile(yearly[:, y], 10))
        p90 = float(np.percentile(yearly[:, y], 90))
        projections.append(ProjectionPoint(
            year=y + 1,
            net_worth=round(p50, 2),
            low=round(max(0, p10), 2),
            high=round(p90, 2),
        ))

    final = projections[-1].net_worth if projections else 0
    total_contributed = req.monthly_savings * 12 * req.years

    return SimulateOut(
        projections=projections,
        final_net_worth=final,
        total_contributed=round(total_contributed, 2),
    )
