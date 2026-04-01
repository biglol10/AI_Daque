# Design Ref: §5.1 — Cost Limiter for API Calls

COST_LIMITS: dict[str, int] = {
    "interview_calls": 50,
    "image_generations": 30,
}


class CostLimiter:
    """In-memory cost limiter tracking API call counts per project."""

    def __init__(self) -> None:
        # {project_id: {operation: count}}
        self._counters: dict[str, dict[str, int]] = {}

    def _get_count(self, project_id: str, operation: str) -> int:
        return self._counters.get(project_id, {}).get(operation, 0)

    def _increment(self, project_id: str, operation: str) -> None:
        if project_id not in self._counters:
            self._counters[project_id] = {}
        current = self._counters[project_id].get(operation, 0)
        self._counters[project_id][operation] = current + 1

    async def check(self, project_id: str, operation: str) -> bool:
        """Check if the operation is within cost limits.

        Returns True if the operation is allowed, False if limit exceeded.
        Automatically increments the counter when allowed.
        """
        limit = COST_LIMITS.get(operation)
        if limit is None:
            # No limit configured for this operation — allow
            return True

        current = self._get_count(project_id, operation)
        if current >= limit:
            return False

        self._increment(project_id, operation)
        return True

    def get_usage(self, project_id: str) -> dict[str, dict[str, int]]:
        """Get current usage stats for a project."""
        counters = self._counters.get(project_id, {})
        return {
            operation: {
                "used": counters.get(operation, 0),
                "limit": limit,
            }
            for operation, limit in COST_LIMITS.items()
        }

    def reset(self, project_id: str) -> None:
        """Reset all counters for a project."""
        self._counters.pop(project_id, None)


# Module-level singleton
cost_limiter = CostLimiter()
