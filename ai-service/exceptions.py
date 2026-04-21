from fastapi import HTTPException


class ModelNotLoadedError(RuntimeError):
    """Raised when a prediction is attempted before the model is loaded."""


class FeatureMismatchError(ValueError):
    """
    Raised when the incoming feature set does not match what the trained
    pipeline expects.
    """

    def __init__(self, expected: list[str], received: list[str]) -> None:
        missing = sorted(set(expected) - set(received))
        extra = sorted(set(received) - set(expected))
        self.missing = missing
        self.extra = extra
        super().__init__(
            f"Feature mismatch — missing: {missing}, unexpected: {extra}"
        )


def raise_503(detail: str) -> None:
    raise HTTPException(status_code=503, detail=detail)


def raise_422(detail: str) -> None:
    raise HTTPException(status_code=422, detail=detail)
