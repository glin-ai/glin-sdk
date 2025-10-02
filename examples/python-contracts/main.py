#!/usr/bin/env python3
"""
GLIN Smart Contracts - Professional Registry Example

This example demonstrates professional registration and reputation management:
1. Connect to GLIN network
2. Register as a professional
3. Submit reviews
4. Query reputation and profiles
5. Increase stake
"""

import asyncio
from substrateinterface import SubstrateInterface, Keypair
from glin_sdk.contracts import (
    GlinContracts,
    RegisterProfessionalParams,
    SubmitReviewParams,
    ProfessionalRole
)

# Configuration
RPC_URL = "ws://localhost:9944"  # Change to your node
REGISTRY_ADDRESS = "5Registry..."  # Replace with deployed contract address


async def main():
    print("🚀 GLIN Professional Registry Example\n")

    # Step 1: Connect to GLIN network
    print("📡 Connecting to GLIN network...")
    substrate = SubstrateInterface(url=RPC_URL)
    print("✅ Connected to GLIN network\n")

    # Step 2: Create accounts (Alice = Lawyer, Bob = Client)
    print("👤 Creating test accounts...")
    alice = Keypair.create_from_uri('//Alice')  # Professional (Lawyer)
    bob = Keypair.create_from_uri('//Bob')      # Client
    charlie = Keypair.create_from_uri('//Charlie')  # Another client

    print(f"Professional (Alice): {alice.ss58_address}")
    print(f"Client (Bob): {bob.ss58_address}")
    print(f"Client (Charlie): {charlie.ss58_address}")
    print("")

    # Step 3: Initialize contracts
    print("📝 Initializing contracts...")
    contracts = GlinContracts(
        substrate=substrate,
        keypair=alice,
        registry_address=REGISTRY_ADDRESS
    )
    print("✅ Contracts initialized\n")

    # Step 4: Register as a professional lawyer
    print("📋 Registering as professional lawyer...")
    print("Role: Lawyer")
    print("Stake: 100 GLIN")
    print("Metadata: ipfs://QmXYZ.../alice-profile.json")

    register_params = RegisterProfessionalParams(
        role=ProfessionalRole.LAWYER,
        metadata_uri="ipfs://QmXYZ.../alice-profile.json",
        stake_amount="100000000000000000000"  # 100 GLIN
    )

    result = await contracts.registry.register(register_params)
    if result.success:
        print("✅ Successfully registered as lawyer!")
    else:
        print(f"❌ Failed to register: {result.error}")
        return
    print("")

    # Step 5: Query professional profile
    print("🔍 Querying professional profile...")
    profile = await contracts.registry.get_profile(alice.ss58_address)
    if profile:
        print(f"Account: {profile.account}")
        print(f"Role: {profile.role.value}")
        print(f"Stake: {int(profile.stake_amount) // 10**18} GLIN")
        print(f"Reputation: {profile.reputation_score}")
        print(f"Total Jobs: {profile.total_jobs}")
        print(f"Successful Jobs: {profile.successful_jobs}")
        print(f"Active: {profile.is_active}")
        print(f"Metadata: {profile.metadata_uri}")
    print("")

    # Step 6: Check minimum stake for lawyer role
    print("💰 Checking minimum stake requirements...")
    min_stake = await contracts.registry.get_min_stake(ProfessionalRole.LAWYER)
    print(f"Minimum stake for Lawyer: {int(min_stake) // 10**18} GLIN")
    print("")

    # Step 7: Client submits first review
    print("⭐ Client (Bob) submitting 5-star review...")
    contracts.set_keypair(bob)  # Switch to client account

    review_params = SubmitReviewParams(
        professional=alice.ss58_address,
        rating=5,
        comment="Excellent legal services! Very professional and knowledgeable."
    )

    review_result = await contracts.registry.submit_review(review_params)
    if review_result.success:
        print("✅ Review submitted successfully!")
    else:
        print(f"❌ Failed to submit review: {review_result.error}")
    print("")

    # Step 8: Another client submits review
    print("⭐ Client (Charlie) submitting 4-star review...")
    contracts.set_keypair(charlie)

    review_params2 = SubmitReviewParams(
        professional=alice.ss58_address,
        rating=4,
        comment="Good work, delivered on time. Minor communication issues."
    )

    review_result2 = await contracts.registry.submit_review(review_params2)
    if review_result2.success:
        print("✅ Review submitted successfully!")
    else:
        print(f"❌ Failed to submit review: {review_result2.error}")
    print("")

    # Step 9: Query all reviews
    print("🔍 Querying all reviews...")
    review_count = await contracts.registry.get_review_count(alice.ss58_address)
    print(f"Total reviews: {review_count}\n")

    for i in range(review_count):
        review = await contracts.registry.get_review(alice.ss58_address, i)
        if review:
            stars = "⭐" * review.rating
            print(f"Review {i + 1}:")
            print(f"  Rating: {stars} ({review.rating}/5)")
            print(f"  Reviewer: {review.reviewer}")
            print(f"  Comment: {review.comment}")
            print(f"  Date: {review.timestamp}")
            print("")

    # Step 10: Query updated profile with reputation
    print("📊 Checking updated reputation...")
    updated_profile = await contracts.registry.get_profile(alice.ss58_address)
    if updated_profile:
        print(f"Reputation Score: {updated_profile.reputation_score}")
        print(f"Total Jobs: {updated_profile.total_jobs}")
        print(f"Successful Jobs: {updated_profile.successful_jobs}")
        success_rate = (updated_profile.successful_jobs / updated_profile.total_jobs * 100)
        print(f"Success Rate: {success_rate:.1f}%")
    print("")

    # Step 11: Increase stake
    print("💎 Professional increasing stake...")
    contracts.set_keypair(alice)  # Switch back to professional

    increase_result = await contracts.registry.increase_stake("50000000000000000000")  # 50 GLIN
    if increase_result.success:
        print("✅ Stake increased by 50 GLIN!")

        # Check new stake
        new_profile = await contracts.registry.get_profile(alice.ss58_address)
        if new_profile:
            print(f"New stake: {int(new_profile.stake_amount) // 10**18} GLIN")
    else:
        print(f"❌ Failed to increase stake: {increase_result.error}")
    print("")

    # Step 12: Check if active professional
    print("✓ Checking professional status...")
    is_active = await contracts.registry.is_active_professional(alice.ss58_address)
    print(f"Is active professional: {is_active}")
    print("")

    # Step 13: Summary
    print("📊 Professional Profile Summary:")
    print("─" * 60)
    final_profile = await contracts.registry.get_profile(alice.ss58_address)
    if final_profile:
        print(f"Name: Alice (Lawyer)")
        print(f"Stake: {int(final_profile.stake_amount) // 10**18} GLIN")
        print(f"Reputation: {final_profile.reputation_score}/100")
        print(f"Total Jobs: {final_profile.total_jobs}")
        print(f"Successful Jobs: {final_profile.successful_jobs}")
        success_rate = (final_profile.successful_jobs / final_profile.total_jobs * 100)
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Total Reviews: {review_count}")

        # Calculate average rating
        total_rating = 0
        for i in range(review_count):
            review = await contracts.registry.get_review(alice.ss58_address, i)
            if review:
                total_rating += review.rating
        avg_rating = total_rating / review_count if review_count > 0 else 0
        print(f"Average Rating: {avg_rating:.1f}/5.0")
    print("─" * 60)
    print("")

    # Cleanup
    print("🏁 Example completed successfully!")
    substrate.close()


if __name__ == "__main__":
    asyncio.run(main())
