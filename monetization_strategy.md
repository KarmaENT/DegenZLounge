# DeGeNz Lounge - Comprehensive Monetization Strategy

## Overview

This document outlines a comprehensive monetization strategy for DeGeNz Lounge, focusing on sustainable revenue generation while maintaining an excellent user experience. The strategy employs a multi-faceted approach combining subscription tiers, usage-based pricing, and premium features.

## Monetization Model

### Tiered Subscription Plans

The core monetization strategy revolves around a tiered subscription model with clear value propositions:

#### 1. Free Tier (Basic)
- **Price**: $0/month
- **Features**:
  - Create up to 3 custom agents
  - 1 active sandbox session
  - Basic agent templates
  - Standard response speed
  - 7-day message history
  - Community support

#### 2. Pro Tier
- **Price**: $14.99/month or $149.99/year (save ~17%)
- **Features**:
  - Create up to 10 custom agents
  - 5 concurrent sandbox sessions
  - Access to premium agent templates
  - Priority response speed
  - 30-day message history
  - Email support
  - Export conversations
  - Advanced agent tools

#### 3. Team Tier
- **Price**: $39.99/month or $399.99/year (save ~17%)
- **Features**:
  - Up to 5 team members
  - Create up to 25 custom agents
  - 15 concurrent sandbox sessions
  - Team workspace and sharing
  - Collaborative editing
  - 90-day message history
  - Priority email support
  - Advanced analytics

#### 4. Enterprise Tier
- **Price**: Custom pricing
- **Features**:
  - Unlimited team members
  - Unlimited custom agents
  - Unlimited sandbox sessions
  - Custom agent development
  - Dedicated account manager
  - Unlimited message history
  - 24/7 priority support
  - Custom integrations
  - On-premises deployment option
  - SLA guarantees

### Usage-Based Add-ons

In addition to the subscription tiers, usage-based add-ons provide flexibility:

#### 1. Token Packs
- Additional computation tokens for intensive agent tasks
- Pricing: $9.99 for 1,000 tokens, with volume discounts
- Tokens automatically refill with monthly subscription

#### 2. Storage Expansion
- Extended message history beyond tier limits
- Pricing: $4.99/month for each additional 90 days of history

#### 3. Additional Seats (Team/Enterprise)
- Add team members beyond tier limits
- Pricing: $9.99/month per additional seat

### Premium Features

One-time purchases for specialized capabilities:

#### 1. Agent Marketplace
- **Concept**: Marketplace for specialized agent templates
- **Pricing Model**: 
  - Free and premium templates ($4.99-$19.99 per template)
  - Revenue share with template creators (70/30 split)

#### 2. Expert Consultation
- **Concept**: Professional services for custom agent development
- **Pricing Model**: Starting at $199 for basic customization

#### 3. Training Workshops
- **Concept**: Live and recorded workshops on effective agent creation
- **Pricing Model**: $49.99 per workshop or included in Team/Enterprise tiers

## Implementation Details

### Database Schema Updates

```sql
-- Subscription plans table
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    agent_limit INTEGER NOT NULL,
    sandbox_limit INTEGER NOT NULL,
    history_days INTEGER NOT NULL,
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Subscription transactions table
CREATE TABLE subscription_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- 'succeeded', 'failed', 'pending'
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token purchases table
CREATE TABLE token_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'succeeded', 'failed', 'pending'
    payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token usage table
CREATE TABLE token_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sandbox_id INTEGER REFERENCES sandboxes(id),
    agent_id INTEGER REFERENCES agents(id),
    tokens_used INTEGER NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'generation', 'analysis', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace items table
CREATE TABLE marketplace_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'agent_template', 'tool', etc.
    creator_id INTEGER REFERENCES users(id),
    price DECIMAL(10, 2) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2),
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace purchases table
CREATE TABLE marketplace_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES marketplace_items(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'succeeded', 'failed', 'pending'
    payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creator payouts table
CREATE TABLE creator_payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'processed', 'failed'
    payout_method VARCHAR(50),
    payout_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Service

```python
# app/services/subscription_service.py
from app.models.database import db_session
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription, SubscriptionTransaction
from app.services.payment_service import PaymentService
import datetime
import logging

class SubscriptionService:
    def __init__(self, app=None):
        self.app = app
        self.payment_service = PaymentService()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
    
    def get_subscription_plans(self):
        """Get all available subscription plans"""
        try:
            plans = SubscriptionPlan.query.all()
            return plans, None
        except Exception as e:
            logging.error(f"Error getting subscription plans: {str(e)}")
            return None, str(e)
    
    def get_user_subscription(self, user_id):
        """Get current subscription for a user"""
        try:
            subscription = UserSubscription.query.filter_by(user_id=user_id).first()
            return subscription, None
        except Exception as e:
            logging.error(f"Error getting user subscription: {str(e)}")
            return None, str(e)
    
    def create_subscription(self, user_id, plan_id, payment_method_id):
        """Create a new subscription for a user"""
        try:
            # Check if user already has a subscription
            existing_subscription = UserSubscription.query.filter_by(user_id=user_id).first()
            if existing_subscription:
                return None, "User already has an active subscription"
            
            # Get the plan
            plan = SubscriptionPlan.query.get(plan_id)
            if not plan:
                return None, "Invalid subscription plan"
            
            # Get the user
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            # Process payment
            payment_result = self.payment_service.create_subscription(
                customer_id=user.customer_id,
                payment_method_id=payment_method_id,
                plan_id=plan.external_plan_id,
                billing_cycle=plan.billing_cycle
            )
            
            if not payment_result.get('success'):
                return None, payment_result.get('error', 'Payment processing failed')
            
            # Create subscription
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=plan_id,
                status='active',
                start_date=datetime.datetime.utcnow(),
                end_date=self._calculate_end_date(plan.billing_cycle),
                auto_renew=True,
                payment_method_id=payment_method_id
            )
            
            db_session.add(subscription)
            
            # Record transaction
            transaction = SubscriptionTransaction(
                user_id=user_id,
                subscription_id=subscription.id,
                amount=plan.price,
                status='succeeded',
                payment_method='card',
                payment_id=payment_result.get('payment_id'),
                description=f"Subscription to {plan.name} plan"
            )
            
            db_session.add(transaction)
            db_session.commit()
            
            # Update user's subscription tier
            user.subscription_tier = plan.name.lower()
            user.subscription_status = 'active'
            user.subscription_expiry = subscription.end_date
            db_session.commit()
            
            return subscription, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error creating subscription: {str(e)}")
            return None, str(e)
    
    def cancel_subscription(self, user_id):
        """Cancel a user's subscription"""
        try:
            # Get the subscription
            subscription = UserSubscription.query.filter_by(user_id=user_id).first()
            if not subscription:
                return False, "No active subscription found"
            
            # Cancel with payment provider
            cancel_result = self.payment_service.cancel_subscription(subscription.external_subscription_id)
            
            if not cancel_result.get('success'):
                return False, cancel_result.get('error', 'Failed to cancel subscription')
            
            # Update subscription
            subscription.status = 'canceled'
            subscription.auto_renew = False
            
            # Update user
            user = User.query.get(user_id)
            user.subscription_status = 'canceled'
            
            db_session.commit()
            
            return True, "Subscription canceled successfully"
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error canceling subscription: {str(e)}")
            return False, str(e)
    
    def change_subscription_plan(self, user_id, new_plan_id):
        """Change a user's subscription plan"""
        try:
            # Get the current subscription
            subscription = UserSubscription.query.filter_by(user_id=user_id).first()
            if not subscription:
                return None, "No active subscription found"
            
            # Get the new plan
            new_plan = SubscriptionPlan.query.get(new_plan_id)
            if not new_plan:
                return None, "Invalid subscription plan"
            
            # Update with payment provider
            update_result = self.payment_service.update_subscription(
                subscription_id=subscription.external_subscription_id,
                new_plan_id=new_plan.external_plan_id
            )
            
            if not update_result.get('success'):
                return None, update_result.get('error', 'Failed to update subscription')
            
            # Update subscription
            old_plan_id = subscription.plan_id
            subscription.plan_id = new_plan_id
            
            # If upgrading mid-cycle, adjust end date based on prorated amount
            if new_plan.price > subscription.plan.price:
                # Logic for prorating would go here
                pass
            
            # Record transaction for the change
            transaction = SubscriptionTransaction(
                user_id=user_id,
                subscription_id=subscription.id,
                amount=new_plan.price,
                status='succeeded',
                payment_method='card',
                payment_id=update_result.get('payment_id'),
                description=f"Changed subscription from {subscription.plan.name} to {new_plan.name}"
            )
            
            db_session.add(transaction)
            
            # Update user's subscription tier
            user = User.query.get(user_id)
            user.subscription_tier = new_plan.name.lower()
            
            db_session.commit()
            
            return subscription, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error changing subscription plan: {str(e)}")
            return None, str(e)
    
    def process_subscription_renewal(self, subscription_id):
        """Process subscription renewal (called by scheduled job)"""
        try:
            # Get the subscription
            subscription = UserSubscription.query.get(subscription_id)
            if not subscription:
                return False, "Subscription not found"
            
            if not subscription.auto_renew:
                return False, "Auto-renewal is disabled"
            
            # Process payment
            payment_result = self.payment_service.charge_subscription(
                subscription_id=subscription.external_subscription_id
            )
            
            if not payment_result.get('success'):
                # Handle failed payment
                subscription.status = 'past_due'
                user = User.query.get(subscription.user_id)
                user.subscription_status = 'past_due'
                db_session.commit()
                
                # Send notification to user
                # self.notification_service.send_payment_failed_notification(subscription.user_id)
                
                return False, payment_result.get('error', 'Payment processing failed')
            
            # Update subscription dates
            subscription.start_date = datetime.datetime.utcnow()
            subscription.end_date = self._calculate_end_date(subscription.plan.billing_cycle)
            
            # Record transaction
            transaction = SubscriptionTransaction(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                amount=subscription.plan.price,
                status='succeeded',
                payment_method='card',
                payment_id=payment_result.get('payment_id'),
                description=f"Renewal of {subscription.plan.name} plan"
            )
            
            db_session.add(transaction)
            
            # Update user's subscription expiry
            user = User.query.get(subscription.user_id)
            user.subscription_expiry = subscription.end_date
            
            db_session.commit()
            
            return True, "Subscription renewed successfully"
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error processing subscription renewal: {str(e)}")
            return False, str(e)
    
    def _calculate_end_date(self, billing_cycle):
        """Calculate subscription end date based on billing cycle"""
        now = datetime.datetime.utcnow()
        if billing_cycle == 'monthly':
            return now + datetime.timedelta(days=30)
        elif billing_cycle == 'yearly':
            return now + datetime.timedelta(days=365)
        else:
            return now + datetime.timedelta(days=30)  # Default to monthly
```

### Token Service

```python
# app/services/token_service.py
from app.models.database import db_session
from app.models.user import User
from app.models.token import TokenPurchase, TokenUsage
from app.services.payment_service import PaymentService
import logging

class TokenService:
    def __init__(self, app=None):
        self.app = app
        self.payment_service = PaymentService()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
    
    def get_user_token_balance(self, user_id):
        """Get current token balance for a user"""
        try:
            # Calculate tokens purchased
            purchases_query = db_session.query(
                db_session.func.sum(TokenPurchase.amount)
            ).filter(
                TokenPurchase.user_id == user_id,
                TokenPurchase.status == 'succeeded'
            )
            
            total_purchased = purchases_query.scalar() or 0
            
            # Calculate tokens used
            usage_query = db_session.query(
                db_session.func.sum(TokenUsage.tokens_used)
            ).filter(
                TokenUsage.user_id == user_id
            )
            
            total_used = usage_query.scalar() or 0
            
            # Calculate balance
            balance = total_purchased - total_used
            
            return balance, None
        except Exception as e:
            logging.error(f"Error getting token balance: {str(e)}")
            return 0, str(e)
    
    def purchase_tokens(self, user_id, amount, payment_method_id):
        """Purchase additional tokens"""
        try:
            # Get the user
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            # Calculate cost (with volume discounts)
            base_rate = 0.01  # $0.01 per token
            if amount >= 10000:
                cost = amount * 0.007  # 30% discount for 10k+ tokens
            elif amount >= 5000:
                cost = amount * 0.008  # 20% discount for 5k+ tokens
            elif amount >= 1000:
                cost = amount * 0.009  # 10% discount for 1k+ tokens
            else:
                cost = amount * base_rate
            
            # Process payment
            payment_result = self.payment_service.process_payment(
                customer_id=user.customer_id,
                payment_method_id=payment_method_id,
                amount=cost,
                currency='usd',
                description=f"Purchase of {amount} tokens"
            )
            
            if not payment_result.get('success'):
                return None, payment_result.get('error', 'Payment processing failed')
            
            # Record purchase
            purchase = TokenPurchase(
                user_id=user_id,
                amount=amount,
                cost=cost,
                status='succeeded',
                payment_id=payment_result.get('payment_id')
            )
            
            db_session.add(purchase)
            db_session.commit()
            
            return purchase, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error purchasing tokens: {str(e)}")
            return None, str(e)
    
    def record_token_usage(self, user_id, tokens_used, operation_type, sandbox_id=None, agent_id=None):
        """Record token usage for an operation"""
        try:
            # Check if user has sufficient tokens
            balance, error = self.get_user_token_balance(user_id)
            if error:
                return False, error
            
            if balance < tokens_used:
                return False, "Insufficient token balance"
            
            # Record usage
            usage = TokenUsage(
                user_id=user_id,
                sandbox_id=sandbox_id,
                agent_id=agent_id,
                tokens_used=tokens_used,
                operation_type=operation_type
            )
            
            db_session.add(usage)
            db_session.commit()
            
            return True, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error recording token usage: {str(e)}")
            return False, str(e)
    
    def get_token_usage_stats(self, user_id, period='month'):
        """Get token usage statistics for a user"""
        try:
            import sqlalchemy as sa
            from datetime import datetime, timedelta
            
            # Determine date range
            now = datetime.utcnow()
            if period == 'day':
                start_date = now - timedelta(days=1)
            elif period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            elif period == 'year':
                start_date = now - timedelta(days=365)
            else:
                start_date = now - timedelta(days=30)  # Default to month
            
            # Get usage by operation type
            usage_by_type = db_session.query(
                TokenUsage.operation_type,
                sa.func.sum(TokenUsage.tokens_used).label('total')
            ).filter(
                TokenUsage.user_id == user_id,
                TokenUsage.created_at >= start_date
            ).group_by(
                TokenUsage.operation_type
            ).all()
            
            # Get usage by agent
            usage_by_agent = db_session.query(
                TokenUsage.agent_id,
                sa.func.sum(TokenUsage.tokens_used).label('total')
            ).filter(
                TokenUsage.user_id == user_id,
                TokenUsage.created_at >= start_date,
                TokenUsage.agent_id != None
            ).group_by(
                TokenUsage.agent_id
            ).all()
            
            # Get usage by sandbox
            usage_by_sandbox = db_session.query(
                TokenUsage.sandbox_id,
                sa.func.sum(TokenUsage.tokens_used).label('total')
            ).filter(
                TokenUsage.user_id == user_id,
                TokenUsage.created_at >= start_date,
                TokenUsage.sandbox_id != None
            ).group_by(
                TokenUsage.sandbox_id
            ).all()
            
            # Get daily usage
            daily_usage = db_session.query(
                sa.func.date(TokenUsage.created_at).label('date'),
                sa.func.sum(TokenUsage.tokens_used).label('total')
            ).filter(
                TokenUsage.user_id == user_id,
                TokenUsage.created_at >= start_date
            ).group_by(
                sa.func.date(TokenUsage.created_at)
            ).all()
            
            # Format results
            result = {
                'by_type': {item.operation_type: item.total for item in usage_by_type},
                'by_agent': {item.agent_id: item.total for item in usage_by_agent},
                'by_sandbox': {item.sandbox_id: item.total for item in usage_by_sandbox},
                'daily': {str(item.date): item.total for item in daily_usage},
                'total': sum(item.total for item in usage_by_type)
            }
            
            return result, None
        except Exception as e:
            logging.error(f"Error getting token usage stats: {str(e)}")
            return None, str(e)
```

### Marketplace Service

```python
# app/services/marketplace_service.py
from app.models.database import db_session
from app.models.user import User
from app.models.marketplace import MarketplaceItem, MarketplacePurchase, CreatorPayout
from app.services.payment_service import PaymentService
import logging
import datetime

class MarketplaceService:
    def __init__(self, app=None):
        self.app = app
        self.payment_service = PaymentService()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
    
    def get_marketplace_items(self, filters=None, sort_by='created_at', page=1, per_page=20):
        """Get marketplace items with filtering and pagination"""
        try:
            query = MarketplaceItem.query.filter_by(is_approved=True)
            
            # Apply filters
            if filters:
                if 'type' in filters:
                    query = query.filter_by(type=filters['type'])
                if 'creator_id' in filters:
                    query = query.filter_by(creator_id=filters['creator_id'])
                if 'min_price' in filters:
                    query = query.filter(MarketplaceItem.price >= filters['min_price'])
                if 'max_price' in filters:
                    query = query.filter(MarketplaceItem.price <= filters['max_price'])
                if 'featured' in filters:
                    query = query.filter_by(is_featured=filters['featured'])
            
            # Apply sorting
            if sort_by == 'price_asc':
                query = query.order_by(MarketplaceItem.price.asc())
            elif sort_by == 'price_desc':
                query = query.order_by(MarketplaceItem.price.desc())
            elif sort_by == 'rating':
                query = query.order_by(MarketplaceItem.rating.desc())
            elif sort_by == 'downloads':
                query = query.order_by(MarketplaceItem.download_count.desc())
            else:  # default to newest
                query = query.order_by(MarketplaceItem.created_at.desc())
            
            # Apply pagination
            items = query.paginate(page=page, per_page=per_page)
            
            return items, None
        except Exception as e:
            logging.error(f"Error getting marketplace items: {str(e)}")
            return None, str(e)
    
    def get_marketplace_item(self, item_id):
        """Get a specific marketplace item"""
        try:
            item = MarketplaceItem.query.get(item_id)
            if not item:
                return None, "Item not found"
            
            return item, None
        except Exception as e:
            logging.error(f"Error getting marketplace item: {str(e)}")
            return None, str(e)
    
    def create_marketplace_item(self, creator_id, name, description, type, price, content):
        """Create a new marketplace item"""
        try:
            # Validate creator
            creator = User.query.get(creator_id)
            if not creator:
                return None, "Creator not found"
            
            # Create item
            item = MarketplaceItem(
                name=name,
                description=description,
                type=type,
                creator_id=creator_id,
                price=price,
                is_approved=False,  # Requires approval
                content=content
            )
            
            db_session.add(item)
            db_session.commit()
            
            return item, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error creating marketplace item: {str(e)}")
            return None, str(e)
    
    def purchase_marketplace_item(self, user_id, item_id, payment_method_id):
        """Purchase a marketplace item"""
        try:
            # Get the user
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            # Get the item
            item, error = self.get_marketplace_item(item_id)
            if error:
                return None, error
            
            # Check if user already purchased this item
            existing_purchase = MarketplacePurchase.query.filter_by(
                user_id=user_id, item_id=item_id
            ).first()
            
            if existing_purchase:
                return None, "Item already purchased"
            
            # Process payment
            payment_result = self.payment_service.process_payment(
                customer_id=user.customer_id,
                payment_method_id=payment_method_id,
                amount=item.price,
                currency='usd',
                description=f"Purchase of {item.name}"
            )
            
            if not payment_result.get('success'):
                return None, payment_result.get('error', 'Payment processing failed')
            
            # Record purchase
            purchase = MarketplacePurchase(
                user_id=user_id,
                item_id=item_id,
                amount=item.price,
                status='succeeded',
                payment_id=payment_result.get('payment_id')
            )
            
            db_session.add(purchase)
            
            # Update item download count
            item.download_count += 1
            
            db_session.commit()
            
            return purchase, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error purchasing marketplace item: {str(e)}")
            return None, str(e)
    
    def get_user_purchases(self, user_id):
        """Get all marketplace items purchased by a user"""
        try:
            purchases = MarketplacePurchase.query.filter_by(
                user_id=user_id, status='succeeded'
            ).all()
            
            # Get the actual items
            items = []
            for purchase in purchases:
                item, _ = self.get_marketplace_item(purchase.item_id)
                if item:
                    items.append(item)
            
            return items, None
        except Exception as e:
            logging.error(f"Error getting user purchases: {str(e)}")
            return None, str(e)
    
    def get_creator_items(self, creator_id):
        """Get all marketplace items created by a user"""
        try:
            items = MarketplaceItem.query.filter_by(creator_id=creator_id).all()
            return items, None
        except Exception as e:
            logging.error(f"Error getting creator items: {str(e)}")
            return None, str(e)
    
    def calculate_creator_earnings(self, creator_id, period='month'):
        """Calculate earnings for a creator"""
        try:
            from datetime import datetime, timedelta
            
            # Determine date range
            now = datetime.utcnow()
            if period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            elif period == 'year':
                start_date = now - timedelta(days=365)
            elif period == 'all':
                start_date = datetime(1970, 1, 1)
            else:
                start_date = now - timedelta(days=30)  # Default to month
            
            # Get creator's items
            items = MarketplaceItem.query.filter_by(creator_id=creator_id).all()
            item_ids = [item.id for item in items]
            
            if not item_ids:
                return {'total': 0, 'items': {}}, None
            
            # Get purchases for these items
            purchases = MarketplacePurchase.query.filter(
                MarketplacePurchase.item_id.in_(item_ids),
                MarketplacePurchase.status == 'succeeded',
                MarketplacePurchase.created_at >= start_date
            ).all()
            
            # Calculate earnings (70% of purchase price)
            total_earnings = 0
            earnings_by_item = {}
            
            for purchase in purchases:
                item_earning = purchase.amount * 0.7  # 70% revenue share
                total_earnings += item_earning
                
                if purchase.item_id in earnings_by_item:
                    earnings_by_item[purchase.item_id]['amount'] += item_earning
                    earnings_by_item[purchase.item_id]['count'] += 1
                else:
                    earnings_by_item[purchase.item_id] = {
                        'amount': item_earning,
                        'count': 1
                    }
            
            result = {
                'total': total_earnings,
                'items': earnings_by_item
            }
            
            return result, None
        except Exception as e:
            logging.error(f"Error calculating creator earnings: {str(e)}")
            return None, str(e)
    
    def process_creator_payout(self, creator_id, amount, payout_method):
        """Process payout to a creator"""
        try:
            # Get the creator
            creator = User.query.get(creator_id)
            if not creator:
                return None, "Creator not found"
            
            # Calculate available earnings
            earnings, error = self.calculate_creator_earnings(creator_id, 'all')
            if error:
                return None, error
            
            # Get previous payouts
            previous_payouts = db_session.query(
                db_session.func.sum(CreatorPayout.amount)
            ).filter(
                CreatorPayout.user_id == creator_id,
                CreatorPayout.status.in_(['pending', 'processed'])
            ).scalar() or 0
            
            # Calculate available balance
            available_balance = earnings['total'] - previous_payouts
            
            if amount > available_balance:
                return None, f"Insufficient balance. Available: ${available_balance:.2f}"
            
            # Process payout with payment provider
            payout_result = self.payment_service.process_payout(
                user_id=creator_id,
                amount=amount,
                method=payout_method
            )
            
            if not payout_result.get('success'):
                return None, payout_result.get('error', 'Payout processing failed')
            
            # Record payout
            payout = CreatorPayout(
                user_id=creator_id,
                amount=amount,
                status='pending',
                payout_method=payout_method,
                payout_id=payout_result.get('payout_id')
            )
            
            db_session.add(payout)
            db_session.commit()
            
            return payout, None
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error processing creator payout: {str(e)}")
            return None, str(e)
```

### Payment Integration

```python
# app/services/payment_service.py
import stripe
from flask import current_app
import logging

class PaymentService:
    def __init__(self, app=None):
        self.app = app
        self.stripe = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        stripe.api_key = app.config['STRIPE_SECRET_KEY']
        self.stripe = stripe
    
    def create_customer(self, user_id, email, name=None):
        """Create a customer in the payment system"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={'user_id': str(user_id)}
            )
            return {'success': True, 'customer_id': customer.id}
        except Exception as e:
            logging.error(f"Error creating customer: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_subscription(self, customer_id, payment_method_id, plan_id, billing_cycle):
        """Create a subscription for a customer"""
        try:
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    'default_payment_method': payment_method_id
                }
            )
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': plan_id}],
                expand=['latest_invoice.payment_intent']
            )
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'payment_id': subscription.latest_invoice.payment_intent.id
            }
        except Exception as e:
            logging.error(f"Error creating subscription: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def cancel_subscription(self, subscription_id):
        """Cancel a subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return {'success': True}
        except Exception as e:
            logging.error(f"Error canceling subscription: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def update_subscription(self, subscription_id, new_plan_id):
        """Update a subscription to a new plan"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update the subscription item
            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_plan_id
                }],
                proration_behavior='always_invoice'
            )
            
            return {'success': True, 'subscription_id': updated_subscription.id}
        except Exception as e:
            logging.error(f"Error updating subscription: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def charge_subscription(self, subscription_id):
        """Charge a subscription (usually automatic)"""
        try:
            # This is usually handled automatically by Stripe
            # This method is for manual testing or handling special cases
            invoice = stripe.Invoice.create(
                subscription=subscription_id,
                auto_advance=True
            )
            
            # Pay the invoice
            paid_invoice = stripe.Invoice.pay(invoice.id)
            
            return {'success': True, 'invoice_id': paid_invoice.id}
        except Exception as e:
            logging.error(f"Error charging subscription: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def process_payment(self, customer_id, payment_method_id, amount, currency, description):
        """Process a one-time payment"""
        try:
            # Create a payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                customer=customer_id,
                payment_method=payment_method_id,
                confirm=True,
                description=description
            )
            
            return {'success': True, 'payment_id': intent.id}
        except Exception as e:
            logging.error(f"Error processing payment: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def process_payout(self, user_id, amount, method):
        """Process a payout to a creator"""
        try:
            # In a real implementation, this would connect to Stripe Connect
            # or another payout system to transfer funds to the creator
            
            # For demonstration purposes, we'll simulate a successful payout
            payout_id = f"payout_{user_id}_{int(amount * 100)}"
            
            return {'success': True, 'payout_id': payout_id}
        except Exception as e:
            logging.error(f"Error processing payout: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_payment_methods(self, customer_id):
        """Get saved payment methods for a customer"""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type='card'
            )
            
            return {'success': True, 'payment_methods': payment_methods.data}
        except Exception as e:
            logging.error(f"Error getting payment methods: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def add_payment_method(self, customer_id, payment_method_id):
        """Add a new payment method for a customer"""
        try:
            # Attach payment method to customer
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            return {'success': True, 'payment_method': payment_method}
        except Exception as e:
            logging.error(f"Error adding payment method: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def remove_payment_method(self, payment_method_id):
        """Remove a payment method"""
        try:
            payment_method = stripe.PaymentMethod.detach(payment_method_id)
            return {'success': True}
        except Exception as e:
            logging.error(f"Error removing payment method: {str(e)}")
            return {'success': False, 'error': str(e)}
```

### Frontend Subscription Components

```tsx
// frontend/degenz-frontend/src/components/subscription/PricingPlans.tsx
import React from 'react';
import { CheckIcon } from '@heroicons/react/solid';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeature[];
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 1,
    name: 'Free',
    description: 'Basic access to DeGeNz Lounge features',
    price: 0,
    billingCycle: 'monthly',
    features: [
      { name: 'Create up to 3 custom agents', included: true },
      { name: '1 active sandbox session', included: true },
      { name: 'Basic agent templates', included: true },
      { name: 'Standard response speed', included: true },
      { name: '7-day message history', included: true },
      { name: 'Community support', included: true },
      { name: 'Export conversations', included: false },
      { name: 'Advanced agent tools', included: false },
      { name: 'Team workspace', included: false },
    ]
  },
  {
    id: 2,
    name: 'Pro',
    description: 'Enhanced access with more agents and sandboxes',
    price: 14.99,
    billingCycle: 'monthly',
    highlighted: true,
    features: [
      { name: 'Create up to 10 custom agents', included: true },
      { name: '5 concurrent sandbox sessions', included: true },
      { name: 'Premium agent templates', included: true },
      { name: 'Priority response speed', included: true },
      { name: '30-day message history', included: true },
      { name: 'Email support', included: true },
      { name: 'Export conversations', included: true },
      { name: 'Advanced agent tools', included: true },
      { name: 'Team workspace', included: false },
    ]
  },
  {
    id: 3,
    name: 'Team',
    description: 'Collaborative features for team productivity',
    price: 39.99,
    billingCycle: 'monthly',
    features: [
      { name: 'Up to 5 team members', included: true },
      { name: 'Create up to 25 custom agents', included: true },
      { name: '15 concurrent sandbox sessions', included: true },
      { name: 'Premium agent templates', included: true },
      { name: 'Priority response speed', included: true },
      { name: '90-day message history', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Export conversations', included: true },
      { name: 'Advanced agent tools', included: true },
      { name: 'Team workspace and sharing', included: true },
    ]
  }
];

const PricingPlans: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  
  const handleSelectPlan = (planId: number) => {
    navigate(`/subscribe/${planId}?cycle=${billingCycle}`);
  };
  
  const getAdjustedPrice = (plan: PricingPlan) => {
    if (billingCycle === 'yearly') {
      return plan.price * 10; // 2 months free
    }
    return plan.price;
  };
  
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose the Perfect Plan for Your Needs
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Unlock the full potential of AI agents with our flexible pricing options
          </p>
        </div>
        
        <div className="mt-12 flex justify-center">
          <div className="relative bg-white rounded-lg p-0.5 flex">
            <button
              type="button"
              className={`relative py-2 px-6 border border-transparent rounded-md ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`relative py-2 px-6 border border-transparent rounded-md ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly <span className="text-xs font-semibold">Save 17%</span>
            </button>
          </div>
        </div>
        
        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-600 ring-2 ring-indigo-600'
                  : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
                  <div className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-500">{plan.description}</p>
              </div>
              
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">
                  ${getAdjustedPrice(plan)}
                </span>
                <span className="ml-1 text-xl font-semibold">
                  {plan.price === 0 ? '' : `/${billingCycle === 'monthly' ? 'mo' : 'year'}`}
                </span>
              </div>
              
              <ul className="mt-6 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-start">
                    <div className="flex-shrink-0">
                      {feature.included ? (
                        <CheckIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="h-6 w-6 text-gray-300">✕</div>
                      )}
                    </div>
                    <p className="ml-3 text-base text-gray-500">{feature.name}</p>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <button
                  type="button"
                  className={`w-full py-3 px-4 rounded-md shadow ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50'
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900">Enterprise Plan</h3>
          <p className="mt-4 text-lg text-gray-600">
            Need a custom solution for your organization?
          </p>
          <div className="mt-6">
            <a
              href="/contact-sales"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
```

### Subscription Checkout Component

```tsx
// frontend/degenz-frontend/src/components/subscription/SubscriptionCheckout.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import subscriptionService from '../../services/subscriptionService';
import authService from '../../services/authService';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const SubscriptionCheckout: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const billingCycle = searchParams.get('cycle') || 'monthly';
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const planData = await subscriptionService.getPlan(Number(planId), billingCycle);
        setPlan(planData);
      } catch (err) {
        setError('Failed to load plan details');
        console.error(err);
      }
    };
    
    fetchPlan();
  }, [planId, billingCycle]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !plan) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = await authService.getCurrentUser();
      
      // Create payment method
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Subscribe to plan
      await subscriptionService.subscribe(
        user.id,
        plan.id,
        billingCycle,
        paymentMethod.id
      );
      
      setSuccess(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to process subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!plan) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 bg-indigo-600 sm:p-10 sm:pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl leading-8 font-extrabold text-white sm:text-3xl">
              {plan.name} Plan
            </h2>
            <div className="text-white text-right">
              <span className="text-4xl font-extrabold">
                ${billingCycle === 'yearly' ? plan.price * 10 : plan.price}
              </span>
              <span className="text-xl font-medium ml-1">
                /{billingCycle === 'monthly' ? 'mo' : 'year'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-base text-indigo-200">{plan.description}</p>
        </div>
        
        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
          <ul className="space-y-4">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">{feature}</p>
              </li>
            ))}
          </ul>
          
          {success ? (
            <div className="mt-8 p-4 bg-green-100 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Subscription successful!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Thank you for subscribing to the {plan.name} plan. Redirecting to dashboard...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-100 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="card-element" className="block text-sm font-medium text-gray-700">
                  Card details
                </label>
                <div className="mt-1 p-3 border border-gray-300 rounded-md shadow-sm">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the <a href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={!stripe || loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
                </button>
              </div>
              
              <div className="text-sm text-gray-500 text-center">
                You can cancel or change your subscription at any time.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
```

### Token Purchase Component

```tsx
// frontend/degenz-frontend/src/components/tokens/TokenPurchase.tsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import tokenService from '../../services/tokenService';
import authService from '../../services/authService';

interface TokenPackage {
  id: number;
  amount: number;
  price: number;
  discount: number;
}

const tokenPackages: TokenPackage[] = [
  { id: 1, amount: 100, price: 0.99, discount: 0 },
  { id: 2, amount: 500, price: 4.49, discount: 10 },
  { id: 3, amount: 1000, price: 8.49, discount: 15 },
  { id: 4, amount: 5000, price: 39.99, discount: 20 },
  { id: 5, amount: 10000, price: 69.99, discount: 30 },
];

const TokenPurchase: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  
  const stripe = useStripe();
  const elements = useElements();
  
  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const user = await authService.getCurrentUser();
        const tokenBalance = await tokenService.getBalance(user.id);
        setBalance(tokenBalance);
      } catch (err) {
        console.error('Failed to fetch token balance:', err);
      }
    };
    
    fetchBalance();
  }, [success]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !selectedPackage) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = await authService.getCurrentUser();
      
      // Create payment method
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Purchase tokens
      await tokenService.purchaseTokens(
        user.id,
        selectedPackage.amount,
        paymentMethod.id
      );
      
      setSuccess(true);
      setSelectedPackage(null);
      
      // Reset form after short delay
      setTimeout(() => {
        setSuccess(false);
        if (cardElement) {
          cardElement.clear();
        }
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to process token purchase');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 bg-indigo-600 sm:p-10 sm:pb-6">
          <h2 className="text-2xl leading-8 font-extrabold text-white sm:text-3xl">
            Purchase Tokens
          </h2>
          <p className="mt-2 text-base text-indigo-200">
            Tokens are used for advanced agent operations and special features
          </p>
          
          {balance !== null && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-800 text-white">
              Current Balance: {balance} tokens
            </div>
          )}
        </div>
        
        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokenPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border p-4 flex flex-col ${
                    selectedPackage?.id === pkg.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{pkg.amount} Tokens</h3>
                    {pkg.discount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Save {pkg.discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">${pkg.price}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    ${(pkg.price / pkg.amount).toFixed(4)} per token
                  </div>
                  <button
                    type="button"
                    className={`mt-4 w-full py-2 px-3 border rounded-md shadow-sm text-sm font-medium ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-indigo-600 text-white border-transparent'
                        : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {selectedPackage?.id === pkg.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
            
            {success ? (
              <div className="mt-8 p-4 bg-green-100 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Purchase successful!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your tokens have been added to your account.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedPackage ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-100 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="card-element" className="block text-sm font-medium text-gray-700">
                    Card details
                  </label>
                  <div className="mt-1 p-3 border border-gray-300 rounded-md shadow-sm">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={!stripe || loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : `Purchase ${selectedPackage.amount} Tokens for $${selectedPackage.price}`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-8 text-center text-gray-500">
                Select a token package to continue
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
```

## Marketing and Conversion Strategy

### Free Trial and Onboarding

1. **14-Day Free Trial**
   - Full access to Pro tier features
   - No credit card required for trial
   - Guided onboarding experience

2. **Conversion Funnel**
   - Day 1: Welcome email with quick start guide
   - Day 3: Feature spotlight (Agent Creation)
   - Day 7: Success stories and use cases
   - Day 10: Personalized usage report
   - Day 12: Trial ending reminder with special offer
   - Day 14: Final conversion opportunity

3. **Onboarding Experience**
   - Interactive tutorial
   - Pre-built agent templates
   - Sample sandbox sessions
   - Achievement badges for completing onboarding steps

### Retention and Engagement

1. **Usage-Based Incentives**
   - Bonus tokens for consistent usage
   - Loyalty rewards for subscription longevity
   - Referral program (1 month free for both referrer and referee)

2. **Community Building**
   - Public agent template library
   - User forums and discussion boards
   - Monthly webinars and workshops
   - Featured user projects

3. **Regular Value Additions**
   - Monthly new agent templates
   - Quarterly feature updates
   - Educational content on effective agent creation

## Analytics and Optimization

### Key Metrics to Track

1. **Acquisition Metrics**
   - Visitor-to-signup conversion rate
   - Cost per acquisition (CPA)
   - Traffic sources and campaign performance

2. **Engagement Metrics**
   - Daily/weekly active users (DAU/WAU)
   - Session duration and frequency
   - Feature usage distribution
   - Agent creation and sandbox session counts

3. **Monetization Metrics**
   - Monthly recurring revenue (MRR)
   - Average revenue per user (ARPU)
   - Conversion rate (free to paid)
   - Churn rate and retention
   - Lifetime value (LTV)

### Optimization Strategy

1. **A/B Testing Framework**
   - Pricing page variations
   - Feature highlighting
   - Onboarding flow optimization
   - Email campaign effectiveness

2. **Churn Prevention**
   - Early warning system based on usage patterns
   - Re-engagement campaigns for at-risk users
   - Exit surveys for churned customers
   - Win-back campaigns with special offers

3. **Pricing Optimization**
   - Quarterly pricing review
   - Value perception surveys
   - Competitive analysis
   - Price elasticity testing

## Implementation Roadmap

### Phase 1: Core Monetization (Month 1)
- Implement subscription database schema
- Integrate payment processing (Stripe)
- Create subscription management UI
- Set up basic analytics tracking

### Phase 2: Enhanced Features (Month 2)
- Implement token system
- Create usage tracking and limits
- Develop subscription tier enforcement
- Build billing management portal

### Phase 3: Marketplace (Month 3)
- Develop agent template marketplace
- Implement creator payments system
- Create submission and approval workflow
- Build discovery and recommendation engine

### Phase 4: Optimization (Month 4)
- Implement A/B testing framework
- Create detailed analytics dashboard
- Develop churn prediction model
- Optimize conversion funnel

## Conclusion

This comprehensive monetization strategy for DeGeNz Lounge balances revenue generation with user value through:

1. **Tiered Subscriptions**: Clear value progression from Free to Enterprise
2. **Usage-Based Add-ons**: Flexibility for power users with token system
3. **Marketplace**: Community-driven content with revenue sharing
4. **Retention Focus**: Strong emphasis on user engagement and long-term value

The implementation provides a solid foundation for sustainable growth while maintaining an excellent user experience. The strategy is designed to be adaptable, with regular review cycles to optimize pricing, features, and conversion rates based on real-world data and user feedback.
