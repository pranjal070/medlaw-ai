import re
from typing import Dict, Any, Optional, Tuple

def parse_float_val(val_str: str) -> Optional[float]:
    """Cleans and extracts a floating point number from a result value string."""
    if not val_str:
        return None
    try:
        cleaned = re.sub(r"[^\d\.-]", "", str(val_str).strip())
        if cleaned:
            return float(cleaned)
    except Exception:
        pass
    return None

def parse_range_bounds(range_str: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parses reference range strings into (min_val, max_val).
    Examples:
    "12.0 - 16.0" -> (12.0, 16.0)
    "< 200.0" -> (0.0, 200.0)
    "> 40.0" -> (40.0, None)
    "40.0 - 52.0" -> (40.0, 52.0)
    """
    if not range_str:
        return None, None
        
    s = range_str.strip().lower()
    
    # Match range format "min - max"
    range_match = re.search(r"([\d\.]+)\s*(?:-|to|—)\s*([\d\.]+)", s)
    if range_match:
        try:
            return float(range_match.group(1)), float(range_match.group(2))
        except Exception:
            pass
            
    # Match less than "< max"
    lt_match = re.search(r"<\s*([\d\.]+)", s)
    if lt_match:
        try:
            return 0.0, float(lt_match.group(1))
        except Exception:
            pass
            
    # Match greater than "> min"
    gt_match = re.search(r">\s*([\d\.]+)", s)
    if gt_match:
        try:
            return float(gt_match.group(1)), None
        except Exception:
            pass
            
    return None, None

def evaluate_test_status(observed_str: str, range_str: Optional[str] = None, current_status: Optional[str] = None) -> str:
    """
    Evaluates status: 'Normal', 'Low', 'High', 'Borderline', 'Critical', or 'Unknown'.
    If current_status is provided by Gemini AI, validates or refines it.
    """
    if current_status and current_status in ["Low", "High", "Normal", "Borderline", "Critical", "Attention"]:
        if current_status == "Attention":
            return "High"
        return current_status
        
    obs_val = parse_float_val(observed_str)
    if obs_val is None or not range_str:
        return current_status or "Normal"
        
    min_val, max_val = parse_range_bounds(range_str)
    
    if min_val is not None and max_val is not None:
        if obs_val < min_val:
            return "Low"
        elif obs_val > max_val:
            return "High"
        else:
            return "Normal"
    elif max_val is not None:
        if obs_val > max_val:
            return "High"
        else:
            return "Normal"
    elif min_val is not None:
        if obs_val < min_val:
            return "Low"
        else:
            return "Normal"
            
    return current_status or "Normal"

def generate_test_interpretation(test_name: str, observed_val: str, unit: str, range_str: str, status: str) -> str:
    """Generates an individualized plain-English interpretation for any laboratory test."""
    unit_str = f" {unit}" if unit else ""
    ref_str = f" (Reference: {range_str})" if range_str else ""
    
    if status == "Normal":
        return f"{test_name} measured at {observed_val}{unit_str}{ref_str} is within the healthy reference range, indicating normal physiological baseline."
    elif status in ["High", "Critical"]:
        return f"{test_name} measured at {observed_val}{unit_str}{ref_str} is above the standard reference limit, indicating an elevated level that should be reviewed."
    elif status == "Low":
        return f"{test_name} measured at {observed_val}{unit_str}{ref_str} is below the standard reference limit, indicating a deficient level."
    elif status == "Borderline":
        return f"{test_name} measured at {observed_val}{unit_str}{ref_str} is near the reference boundary and warrants routine monitoring."
    else:
        return f"{test_name} measured at {observed_val}{unit_str}{ref_str}."

def generate_test_recommendation(test_name: str, status: str) -> str:
    """Generates a targeted, actionable lifestyle/dietary recommendation for a test parameter."""
    tlower = test_name.lower()
    
    if status == "Normal":
        return "Maintain your current healthy balanced diet, hydration, and regular routine health screenings."
        
    if "cholesterol" in tlower or "ldl" in tlower or "triglyceride" in tlower or "lipid" in tlower:
        if status in ["High", "Critical"]:
            return "Incorporate soluble fiber, oats, omega-3 rich foods (walnuts, salmon, olive oil), and reduce saturated/trans fats. Engage in daily 30-min exercise."
    elif "vitamin d" in tlower:
        if status == "Low":
            return "Get 15-20 minutes of daily morning sunlight. Add egg yolks, fatty fish, fortified dairy, and discuss Vitamin D3 supplementation with your physician."
    elif "vitamin b12" in tlower:
        if status == "Low":
            return "Incorporate dairy products, eggs, fish, lean poultry, or fortified plant milks/cereals. Consult your doctor if experiencing numbness or fatigue."
    elif "glucose" in tlower or "hba1c" in tlower or "sugar" in tlower:
        if status in ["High", "Critical"]:
            return "Eliminate refined sugars, sodas, and sweet pastries. Focus on high-fiber vegetables, whole grains, and track fasting sugar levels."
    elif "hemoglobin" in tlower or "hb" in tlower:
        if status == "Low":
            return "Consume iron-rich foods (spinach, lentils, red meat, legumes) paired with Vitamin C (citrus, oranges) to enhance absorption. Re-check complete blood count."
    elif "uric acid" in tlower:
        if status in ["High", "Critical"]:
            return "Drink at least 3 liters of water daily. Avoid organ meats, red meat, shellfish, beer/alcohol, and high-fructose corn syrup."
    elif "creatinine" in tname.lower() or "urea" in tlower:
        if status in ["High", "Critical"]:
            return "Ensure optimal daily fluid hydration. Avoid excessive protein powder supplements, heavy sodium, and unprescribed NSAID pain relievers."
    elif "crp" in tlower or "c-reactive" in tlower:
        if status in ["High", "Critical"]:
            return "Follow an anti-inflammatory Mediterranean diet (berries, greens, olive oil). Monitor for physical stress, joint discomfort, or active infection."

    if status in ["High", "Critical"]:
        return "Review this elevated parameter with your primary care physician to assess potential underlying factors."
    elif status == "Low":
        return "Discuss targeted nutritional adjustments or follow-up blood work with your healthcare practitioner."
    else:
        return "Follow routine healthcare guidance and maintain balanced daily wellness habits."
