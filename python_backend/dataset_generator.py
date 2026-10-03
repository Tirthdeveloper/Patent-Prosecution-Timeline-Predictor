"""
USPTO Patent Prosecution Synthetic Dataset Generator
Simulates 10,000 realistic patent prosecution docket histories based on
USPTO Data Visualization Center empirical distributions and PatentsView metadata.
"""

import json
import random
import csv
import math

TECH_CENTERS = ["1600", "1700", "2100", "2400", "2600", "2800", "3600", "3700"]
TRACKS = ["standard", "trackOne", "pph", "accelerated"]
ENTITIES = ["large", "small", "micro"]
EXAMINERS = ["lenient", "moderate", "strict"]

def generate_sample():
    app_id = f"17/{random.randint(100000, 999999)}"
    tc = random.choice(TECH_CENTERS)
    track = random.choices(TRACKS, weights=[0.78, 0.12, 0.07, 0.03])[0]
    entity = random.choices(ENTITIES, weights=[0.55, 0.35, 0.10])[0]
    examiner = random.choices(EXAMINERS, weights=[0.25, 0.50, 0.25])[0]

    indep_claims = random.choices([1, 2, 3, 4, 5, 6], weights=[0.05, 0.15, 0.60, 0.12, 0.05, 0.03])[0]
    total_claims = indep_claims + random.randint(10, 30)
    prior_art = max(1, int(random.gauss(15, 8)))

    # Base FOA by Tech Center
    tc_foa_means = {
        "1600": 22.4, "1700": 19.1, "2100": 21.8, "2400": 20.5,
        "2600": 18.7, "2800": 16.4, "3600": 25.2, "3700": 17.8
    }

    base_foa = tc_foa_means[tc]
    
    # Adjust for track
    if track == "trackOne":
        foa_months = max(2.5, random.gauss(3.6, 0.8))
    elif track == "pph":
        foa_months = max(4.0, random.gauss(5.8, 1.2))
    elif track == "accelerated":
        foa_months = max(3.5, random.gauss(4.8, 1.0))
    else:
        # Standard
        speed_mult = 0.9 if examiner == "lenient" else (1.18 if examiner == "strict" else 1.0)
        foa_months = max(6.0, random.gauss(base_foa * speed_mult, 4.5))

    foa_months = round(foa_months, 1)

    # First Action Allowance Probability
    first_act_allow_prob = 0.06 if track == "standard" else 0.18
    if examiner == "lenient": first_act_allow_prob += 0.06
    if examiner == "strict": first_act_allow_prob = max(0.01, first_act_allow_prob - 0.04)

    is_first_action_allowance = (random.random() < first_act_allow_prob)

    if is_first_action_allowance:
        oa_count = 1
        rce_count = 0
        grant_status = "Granted"
        total_pendency = foa_months + random.gauss(3.0, 0.5)
    else:
        # Round 1 response
        resp_time = max(1.5, random.gauss(2.8, 0.5))
        pendency_so_far = foa_months + resp_time
        oa_count = 1

        # Post-response allowance probability
        post_resp_prob = 0.55 if examiner == "lenient" else (0.35 if examiner == "strict" else 0.45)
        if random.random() < post_resp_prob:
            grant_status = "Granted"
            rce_count = 0
            total_pendency = pendency_so_far + max(2.0, random.gauss(3.0, 0.5))
        else:
            # Final Office Action
            oa_count += 1
            final_oa_time = max(1.5, random.gauss(2.5, 0.6))
            pendency_so_far += final_oa_time

            # Applicant action post-final
            roll = random.random()
            if roll < 0.65:
                # File RCE
                rce_count = 1
                oa_count += 1
                rce_cycle = max(4.0, random.weibullvariate(3.2, 10.5))
                pendency_so_far += rce_cycle
                
                # RCE outcome
                if random.random() < 0.70:
                    grant_status = "Granted"
                    total_pendency = pendency_so_far + 3.0
                else:
                    if random.random() < 0.35:
                        rce_count += 1
                        oa_count += 1
                        pendency_so_far += max(4.0, random.weibullvariate(3.0, 9.5))
                        grant_status = "Granted" if random.random() < 0.55 else "Abandoned"
                        total_pendency = pendency_so_far + (3.0 if grant_status == "Granted" else 0)
                    else:
                        grant_status = "Abandoned"
                        total_pendency = pendency_so_far
            elif roll < 0.77:
                # PTAB Appeal
                rce_count = 0
                appeal_time = max(12.0, random.gauss(22.0, 4.0))
                pendency_so_far += appeal_time
                grant_status = "Granted" if random.random() < 0.42 else "Abandoned"
                total_pendency = pendency_so_far
            else:
                grant_status = "Abandoned"
                rce_count = 0
                total_pendency = pendency_so_far

    total_pendency = round(max(4.0, total_pendency), 1)

    return {
        "app_id": app_id,
        "tech_center": tc,
        "track": track,
        "entity_size": entity,
        "examiner_difficulty": examiner,
        "indep_claims": indep_claims,
        "total_claims": total_claims,
        "prior_art_citations": prior_art,
        "time_to_foa_months": foa_months,
        "office_actions_count": oa_count,
        "rce_count": rce_count,
        "grant_status": grant_status,
        "total_pendency_months": total_pendency
    }

def generate_dataset(num_samples=10000, output_csv="uspto_prosecution_dataset.csv"):
    print(f"Generating {num_samples} simulated patent prosecution records...")
    samples = [generate_sample() for _ in range(num_samples)]
    
    with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(samples[0].keys()))
        writer.writeheader()
        writer.writerows(samples)
    
    print(f"Successfully generated {output_csv} with {num_samples} records.")
    return output_csv

if __name__ == "__main__":
    generate_dataset()
