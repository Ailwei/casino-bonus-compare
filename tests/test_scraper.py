import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scraper import validate


def test_validate_keeps_values_with_matching_evidence():
    source = (
        "Welcome bonus 100% match up to R5,000. "
        "Wagering Requirement 35x. Minimum Deposit R20."
    )

    raw = {
        "welcome_bonus": "100% match up to R5,000",
        "wagering_requirement": 35,
        "min_deposit": 20,
        "currency": "ZAR",
        "evidence": {
            "welcome_bonus": "Welcome bonus 100% match up to R5,000.",
            "wagering_requirement": "Wagering Requirement 35x.",
            "min_deposit": "Minimum Deposit R20.",
        },
    }

    result = validate(raw, source)

    assert result["welcome_bonus"] == "100% match up to R5,000"
    assert result["wagering_requirement"] == 35
    assert result["min_deposit"] == 20
    assert result["currency"] == "ZAR"


def test_validate_rejects_values_without_matching_evidence():
    source = "Welcome bonus 100% match up to R5,000."

    raw = {
        "welcome_bonus": "100% match up to R5,000",
        "wagering_requirement": 35,
        "min_deposit": 20,
        "currency": "ZAR",
        "evidence": {
            "welcome_bonus": "Welcome bonus 100% match up to R5,000.",
            "wagering_requirement": "Wagering requirement 35x.",
            "min_deposit": "Minimum deposit R20.",
        },
    }

    result = validate(raw, source)

    assert result["welcome_bonus"] == "100% match up to R5,000"
    assert result["wagering_requirement"] is None
    assert result["min_deposit"] is None


def test_validate_rejects_invalid_wagering_values():
    source = "Welcome bonus 100% match up to R5,000."

    raw = {
        "welcome_bonus": "100% match up to R5,000",
        "wagering_requirement": True,
        "min_deposit": -1,
        "currency": None,
        "evidence": {
            "welcome_bonus": "Welcome bonus 100% match up to R5,000.",
        },
    }

    result = validate(raw, source)

    assert result["wagering_requirement"] is None
    assert result["min_deposit"] is None
    assert result["currency"] == "ZAR"
