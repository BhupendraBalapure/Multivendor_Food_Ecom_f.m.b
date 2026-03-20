from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.core.files.base import ContentFile
from decimal import Decimal
import io

from apps.accounts.models import User
from apps.sellers.models import SellerProfile, SellerOperatingDay
from apps.menu.models import Category, MenuItem, SubscriptionPlan


def generate_food_image(text, bg_color, size=(400, 300)):
    """Generate a simple placeholder food image with Pillow."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGB', size, bg_color)
        draw = ImageDraw.Draw(img)

        # Try to use a decent font size
        font_size = 28
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
            except (IOError, OSError):
                font = ImageFont.load_default()

        # Add subtle gradient overlay
        for y in range(size[1]):
            alpha = int(40 * (y / size[1]))
            draw.line([(0, y), (size[0], y)], fill=(0, 0, 0, alpha) if img.mode == 'RGBA' else tuple(max(0, c - alpha) for c in bg_color))

        # Center text
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (size[0] - tw) // 2
        y = (size[1] - th) // 2

        # Text shadow
        draw.text((x + 1, y + 1), text, fill=(0, 0, 0), font=font)
        draw.text((x, y), text, fill=(255, 255, 255), font=font)

        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        return buf.getvalue()
    except ImportError:
        return None


# Color palettes for categories
CATEGORY_COLORS = {
    'thali': (230, 126, 34),
    'biryani-rice': (241, 196, 15),
    'roti-bread': (211, 84, 0),
    'dal-curry': (192, 57, 43),
    'snacks-chaat': (39, 174, 96),
    'sweets-desserts': (142, 68, 173),
    'tiffin': (52, 152, 219),
}

# Color palettes for food types
FOOD_COLORS = {
    'veg': (46, 125, 50),
    'non_veg': (183, 28, 28),
    'egg': (245, 166, 35),
}


def get_item_color(food_type, meal_type):
    base = FOOD_COLORS.get(food_type, (100, 100, 100))
    # Slightly vary based on meal type
    offsets = {'breakfast': (30, 20, 0), 'lunch': (0, 10, 30), 'dinner': (-20, 0, 20), 'snack': (20, 30, 10)}
    off = offsets.get(meal_type, (0, 0, 0))
    return tuple(max(0, min(255, base[i] + off[i])) for i in range(3))


class Command(BaseCommand):
    help = 'Seed database with categories, sellers, and menu items'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing seed data before re-seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            MenuItem.objects.all().delete()
            SubscriptionPlan.objects.all().delete()
            Category.objects.all().delete()
            SellerOperatingDay.objects.all().delete()
            SellerProfile.objects.all().delete()
            User.objects.filter(role='seller').delete()
            self.stdout.write(self.style.SUCCESS('Cleared!'))

        self._create_categories()
        self._create_sellers()
        self._create_menu_items()
        self._create_subscription_plans()
        self._add_images()

        self.stdout.write(self.style.SUCCESS('\nSeed data created successfully!'))

    def _create_categories(self):
        self.stdout.write('\nCreating categories...')
        categories = [
            {'name': 'Thali', 'display_order': 1},
            {'name': 'Biryani & Rice', 'display_order': 2},
            {'name': 'Roti & Bread', 'display_order': 3},
            {'name': 'Dal & Curry', 'display_order': 4},
            {'name': 'Snacks & Chaat', 'display_order': 5},
            {'name': 'Sweets & Desserts', 'display_order': 6},
            {'name': 'Tiffin', 'display_order': 7},
        ]
        for cat_data in categories:
            cat, created = Category.objects.get_or_create(
                slug=slugify(cat_data['name']),
                defaults={
                    'name': cat_data['name'],
                    'display_order': cat_data['display_order'],
                    'is_active': True,
                },
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: {cat.name}')

    def _create_sellers(self):
        self.stdout.write('\nCreating sellers...')
        sellers = [
            {
                'email': 'annapurna@mealontime.com',
                'phone': '9876543101',
                'full_name': 'Priya Sharma',
                'kitchen_name': 'Annapurna Kitchen',
                'description': 'Authentic homestyle Maharashtrian & North Indian meals prepared daily with fresh ingredients.',
                'city': 'Pune',
                'state': 'Maharashtra',
                'address_line': '45, FC Road, Shivajinagar',
                'pincode': '411005',
                'average_rating': Decimal('4.5'),
                'total_ratings': 120,
                'minimum_order_amount': Decimal('100'),
                'fssai_license': 'FSSAI10020030040',
            },
            {
                'email': 'balaji@mealontime.com',
                'phone': '9876543102',
                'full_name': 'Rajesh Patel',
                'kitchen_name': 'Shree Balaji Tiffins',
                'description': 'Pure vegetarian tiffin service, serving wholesome Gujarati & Rajasthani thalis since 2018.',
                'city': 'Pune',
                'state': 'Maharashtra',
                'address_line': '12, JM Road, Deccan',
                'pincode': '411004',
                'average_rating': Decimal('4.3'),
                'total_ratings': 89,
                'minimum_order_amount': Decimal('80'),
                'fssai_license': 'FSSAI10020030041',
            },
            {
                'email': 'biryanihouse@mealontime.com',
                'phone': '9876543103',
                'full_name': 'Ahmed Khan',
                'kitchen_name': 'Biryani House',
                'description': 'Premium Hyderabadi-style biryani and kebabs, cooked in traditional dum style.',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'address_line': '78, Mohammed Ali Road, Bhendi Bazaar',
                'pincode': '400003',
                'average_rating': Decimal('4.7'),
                'total_ratings': 210,
                'minimum_order_amount': Decimal('150'),
                'fssai_license': 'FSSAI10020030042',
            },
            {
                'email': 'maakakhana@mealontime.com',
                'phone': '9876543104',
                'full_name': 'Sunita Verma',
                'kitchen_name': 'Maa Ka Khana',
                'description': 'Home-cooked North Indian meals just like mom makes. Daily fresh menu with love.',
                'city': 'Nagpur',
                'state': 'Maharashtra',
                'address_line': '23, Dharampeth, Civil Lines',
                'pincode': '440010',
                'average_rating': Decimal('4.2'),
                'total_ratings': 65,
                'minimum_order_amount': Decimal('100'),
                'fssai_license': 'FSSAI10020030043',
            },
            {
                'email': 'dakshin@mealontime.com',
                'phone': '9876543105',
                'full_name': 'Lakshmi Iyer',
                'kitchen_name': 'Dakshin Flavors',
                'description': 'Authentic South Indian breakfast and meals. From crispy dosas to full South Indian thalis.',
                'city': 'Pune',
                'state': 'Maharashtra',
                'address_line': '56, Koregaon Park, Lane 7',
                'pincode': '411001',
                'average_rating': Decimal('4.6'),
                'total_ratings': 150,
                'minimum_order_amount': Decimal('80'),
                'fssai_license': 'FSSAI10020030044',
            },
        ]

        for s in sellers:
            user, user_created = User.objects.get_or_create(
                email=s['email'],
                defaults={
                    'phone': s['phone'],
                    'full_name': s['full_name'],
                    'role': 'seller',
                    'is_email_verified': True,
                    'is_phone_verified': True,
                },
            )
            if user_created:
                user.set_password('seller123')
                user.save()

            slug = slugify(s['kitchen_name'])
            profile, prof_created = SellerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'kitchen_name': s['kitchen_name'],
                    'slug': slug,
                    'description': s['description'],
                    'address_line': s['address_line'],
                    'city': s['city'],
                    'state': s['state'],
                    'pincode': s['pincode'],
                    'fssai_license': s['fssai_license'],
                    'approval_status': 'approved',
                    'is_online': True,
                    'is_accepting_orders': True,
                    'opening_time': '08:00',
                    'closing_time': '22:00',
                    'delivery_radius_km': Decimal('5.00'),
                    'minimum_order_amount': s['minimum_order_amount'],
                    'average_rating': s['average_rating'],
                    'total_ratings': s['total_ratings'],
                    'commission_percentage': Decimal('10.00'),
                },
            )

            if prof_created:
                for day in range(7):
                    SellerOperatingDay.objects.get_or_create(
                        seller=profile,
                        day_of_week=day,
                        defaults={'is_open': day < 6},
                    )

            status = 'Created' if prof_created else 'Exists'
            self.stdout.write(f'  {status}: {s["kitchen_name"]} ({s["city"]})')

    def _create_menu_items(self):
        self.stdout.write('\nCreating menu items...')

        sellers = {p.kitchen_name: p for p in SellerProfile.objects.all()}
        categories = {c.slug: c for c in Category.objects.all()}

        items = [
            # === Annapurna Kitchen ===
            {'seller': 'Annapurna Kitchen', 'category': 'thali', 'name': 'Maharashtrian Thali', 'description': 'Complete Maharashtrian thali with varan, bhaat, bhaji, chapati, pickle, papad and sweet.', 'price': 150, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 30, 'calories': 650, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'dal-curry', 'name': 'Paneer Butter Masala', 'description': 'Rich and creamy paneer in tomato-butter gravy with aromatic spices.', 'price': 180, 'discounted_price': 160, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 25, 'calories': 420, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'dal-curry', 'name': 'Chicken Curry', 'description': 'Traditional home-style chicken curry slow-cooked with onion-tomato gravy.', 'price': 200, 'meal_type': 'dinner', 'food_type': 'non_veg', 'prep_time': 35, 'calories': 480, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'snacks-chaat', 'name': 'Poha', 'description': 'Flattened rice tempered with mustard seeds, curry leaves, peanuts and lemon.', 'price': 60, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 250, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'roti-bread', 'name': 'Aloo Paratha', 'description': 'Crispy whole wheat paratha stuffed with spiced mashed potatoes. Served with curd & pickle.', 'price': 80, 'discounted_price': 70, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 20, 'calories': 350, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'dal-curry', 'name': 'Dal Tadka', 'description': 'Yellow lentils tempered with cumin, garlic, ghee and fresh coriander.', 'price': 120, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 20, 'calories': 280, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'biryani-rice', 'name': 'Veg Pulao', 'description': 'Fragrant basmati rice cooked with seasonal vegetables and whole spices.', 'price': 140, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 25, 'calories': 380, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'sweets-desserts', 'name': 'Gulab Jamun', 'description': 'Soft milk-solid dumplings soaked in rose-cardamom flavored sugar syrup. Pack of 4.', 'price': 80, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 10, 'calories': 350, 'serves': 2},

            # === Shree Balaji Tiffins ===
            {'seller': 'Shree Balaji Tiffins', 'category': 'thali', 'name': 'Gujarati Thali', 'description': 'Authentic Gujarati thali with dal, kadhi, shaak, rotli, rice, pickle, papad and sweet.', 'price': 140, 'discounted_price': 120, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 30, 'calories': 600, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'thali', 'name': 'Rajasthani Dal Baati', 'description': 'Traditional baked wheat balls served with panchmel dal and churma.', 'price': 160, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 40, 'calories': 700, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'roti-bread', 'name': 'Puri Bhaji', 'description': 'Fluffy deep-fried puris served with spiced potato bhaji. Set of 4 puris.', 'price': 70, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 20, 'calories': 400, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'snacks-chaat', 'name': 'Dhokla', 'description': 'Steamed fermented chickpea flour cake tempered with mustard seeds and green chillies.', 'price': 50, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 15, 'calories': 180, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'sweets-desserts', 'name': 'Jalebi', 'description': 'Crispy spiral-shaped fermented batter soaked in saffron sugar syrup. Pack of 6.', 'price': 60, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 10, 'calories': 300, 'serves': 2},
            {'seller': 'Shree Balaji Tiffins', 'category': 'dal-curry', 'name': 'Mixed Veg Curry', 'description': 'Seasonal mixed vegetables cooked in a mildly spiced tomato-onion gravy.', 'price': 130, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 25, 'calories': 280, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'roti-bread', 'name': 'Tawa Roti (Pack of 4)', 'description': 'Freshly made whole wheat rotis on tawa. Soft and fluffy.', 'price': 40, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 15, 'calories': 320, 'serves': 1},

            # === Shree Balaji Tiffins - Tiffin Items (individual variety) ===
            {'seller': 'Shree Balaji Tiffins', 'category': 'tiffin', 'name': 'Methi Thepla', 'description': 'Soft Gujarati flatbread made with fenugreek leaves, served with curd and pickle.', 'price': 50, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 280, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'tiffin', 'name': 'Khandvi', 'description': 'Delicate gram flour rolls tempered with mustard seeds, sesame and coconut.', 'price': 60, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 20, 'calories': 200, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'tiffin', 'name': 'Undhiyu', 'description': 'Traditional Gujarati mixed vegetable casserole with fenugreek dumplings, slow-cooked in spices.', 'price': 130, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 35, 'calories': 380, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'tiffin', 'name': 'Bajra Roti with Ringna', 'description': 'Millet flatbread served with spiced brinjal curry and homemade white butter.', 'price': 90, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 25, 'calories': 350, 'serves': 1},
            {'seller': 'Shree Balaji Tiffins', 'category': 'tiffin', 'name': 'Khichdi Kadhi', 'description': 'Comforting moong dal khichdi served with hot Gujarati kadhi and papad.', 'price': 80, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 20, 'calories': 400, 'serves': 1},

            # === Biryani House ===
            {'seller': 'Biryani House', 'category': 'biryani-rice', 'name': 'Chicken Dum Biryani', 'description': 'Authentic Hyderabadi chicken biryani slow-cooked with aromatic basmati rice and spices.', 'price': 220, 'discounted_price': 199, 'meal_type': 'lunch', 'food_type': 'non_veg', 'prep_time': 45, 'calories': 650, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'biryani-rice', 'name': 'Mutton Biryani', 'description': 'Rich and flavorful mutton biryani with tender meat pieces and saffron rice.', 'price': 280, 'meal_type': 'lunch', 'food_type': 'non_veg', 'prep_time': 45, 'calories': 750, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'biryani-rice', 'name': 'Egg Biryani', 'description': 'Fragrant biryani rice layered with spiced boiled eggs and caramelized onions.', 'price': 180, 'meal_type': 'lunch', 'food_type': 'egg', 'prep_time': 35, 'calories': 550, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'biryani-rice', 'name': 'Veg Dum Biryani', 'description': 'Layered biryani with paneer, mixed veggies, and aromatic basmati rice.', 'price': 160, 'discounted_price': 140, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 35, 'calories': 500, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'snacks-chaat', 'name': 'Chicken 65', 'description': 'Spicy deep-fried chicken bites marinated in red chilli paste and yogurt.', 'price': 200, 'meal_type': 'snack', 'food_type': 'non_veg', 'prep_time': 20, 'calories': 400, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'dal-curry', 'name': 'Mirchi Ka Salan', 'description': 'Hyderabadi green chilli curry in peanut-sesame gravy. Perfect biryani companion.', 'price': 100, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 20, 'calories': 200, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'sweets-desserts', 'name': 'Double Ka Meetha', 'description': 'Hyderabadi bread pudding soaked in sweetened milk with dry fruits and saffron.', 'price': 90, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 10, 'calories': 380, 'serves': 1},
            {'seller': 'Biryani House', 'category': 'snacks-chaat', 'name': 'Chicken Tikka', 'description': 'Succulent chicken pieces marinated in yogurt-spice mix, grilled in tandoor.', 'price': 250, 'discounted_price': 220, 'meal_type': 'dinner', 'food_type': 'non_veg', 'prep_time': 30, 'calories': 350, 'serves': 1},

            # === Maa Ka Khana ===
            {'seller': 'Maa Ka Khana', 'category': 'thali', 'name': 'North Indian Thali', 'description': 'Wholesome thali with dal, sabzi, raita, roti, rice, pickle and sweet.', 'price': 130, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 30, 'calories': 600, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'biryani-rice', 'name': 'Rajma Chawal', 'description': 'Punjabi-style kidney bean curry served with steamed basmati rice.', 'price': 120, 'discounted_price': 100, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 25, 'calories': 450, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'snacks-chaat', 'name': 'Chole Bhature', 'description': 'Spicy chickpea curry with fluffy deep-fried bhature. Served with onion & pickle.', 'price': 100, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 25, 'calories': 550, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'dal-curry', 'name': 'Egg Curry', 'description': 'Boiled eggs in a rich onion-tomato masala gravy with aromatic spices.', 'price': 150, 'meal_type': 'dinner', 'food_type': 'egg', 'prep_time': 25, 'calories': 350, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'dal-curry', 'name': 'Aloo Gobhi', 'description': 'Classic dry preparation of potatoes and cauliflower with cumin and turmeric.', 'price': 110, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 20, 'calories': 250, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'roti-bread', 'name': 'Stuffed Paratha Combo', 'description': 'Two stuffed parathas (aloo/gobhi/paneer) served with curd, pickle and butter.', 'price': 90, 'discounted_price': 75, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 20, 'calories': 450, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'sweets-desserts', 'name': 'Kheer', 'description': 'Creamy rice pudding slow-cooked with milk, sugar, cardamom and dry fruits.', 'price': 70, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 10, 'calories': 280, 'serves': 1},

            # === Maa Ka Khana - Tiffin Items (individual variety) ===
            {'seller': 'Maa Ka Khana', 'category': 'tiffin', 'name': 'Moong Dal Chilla', 'description': 'Protein-rich savoury pancake made from ground moong dal, served with green chutney.', 'price': 55, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 220, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'tiffin', 'name': 'Egg Bhurji Pav', 'description': 'Spiced scrambled eggs served with buttered pav bread and onion salad.', 'price': 70, 'meal_type': 'breakfast', 'food_type': 'egg', 'prep_time': 10, 'calories': 350, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'tiffin', 'name': 'Roti Sabzi Combo', 'description': '3 fresh chapatis with seasonal sabzi, dal and salad. Simple home-style dinner.', 'price': 80, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 20, 'calories': 420, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'tiffin', 'name': 'Chicken Curry Rice', 'description': 'Home-style chicken curry served with steamed basmati rice and pickle.', 'price': 130, 'discounted_price': 115, 'meal_type': 'lunch', 'food_type': 'non_veg', 'prep_time': 30, 'calories': 580, 'serves': 1},
            {'seller': 'Maa Ka Khana', 'category': 'tiffin', 'name': 'Paneer Paratha', 'description': 'Crispy whole wheat paratha stuffed with spiced paneer. Served with curd and achaar.', 'price': 75, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 18, 'calories': 380, 'serves': 1},

            # === Annapurna Kitchen - Tiffin Items (individual variety) ===
            {'seller': 'Annapurna Kitchen', 'category': 'tiffin', 'name': 'Sabudana Khichdi', 'description': 'Sago pearls cooked with peanuts, cumin and green chillies. A Maharashtrian fasting favourite.', 'price': 60, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 250, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'tiffin', 'name': 'Misal Pav', 'description': 'Spicy sprouted moth bean curry topped with farsan, served with pav bread and lemon.', 'price': 70, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 380, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'tiffin', 'name': 'Zunka Bhakar', 'description': 'Traditional Maharashtrian gram flour curry served with jowar bhakri and thecha.', 'price': 85, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 25, 'calories': 420, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'tiffin', 'name': 'Varan Bhaat', 'description': 'Comforting Maharashtrian dal served over steamed rice with ghee and lemon.', 'price': 75, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 20, 'calories': 350, 'serves': 1},
            {'seller': 'Annapurna Kitchen', 'category': 'tiffin', 'name': 'Usal Pav', 'description': 'Spicy mixed sprouts curry with pav bread, onion and lemon. High-protein meal.', 'price': 65, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 20, 'calories': 340, 'serves': 1},

            # === Dakshin Flavors ===
            {'seller': 'Dakshin Flavors', 'category': 'snacks-chaat', 'name': 'Masala Dosa', 'description': 'Crispy golden rice-lentil crepe filled with spiced potato masala. Served with sambar & chutney.', 'price': 80, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 350, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'snacks-chaat', 'name': 'Idli Sambar', 'description': 'Steamed rice cakes served with piping hot sambar and coconut chutney. Set of 4.', 'price': 60, 'discounted_price': 50, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 280, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'thali', 'name': 'South Indian Thali', 'description': 'Full meals with rice, sambar, rasam, kootu, poriyal, curd, papad and payasam.', 'price': 160, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 30, 'calories': 650, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'snacks-chaat', 'name': 'Uttapam', 'description': 'Thick rice-lentil pancake topped with onions, tomatoes, and green chillies.', 'price': 90, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 320, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'snacks-chaat', 'name': 'Medu Vada', 'description': 'Crispy deep-fried lentil doughnuts served with sambar and chutney. Set of 3.', 'price': 70, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 15, 'calories': 300, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'biryani-rice', 'name': 'Curd Rice', 'description': 'Cooling tempered yogurt rice with mustard seeds, curry leaves and pomegranate.', 'price': 80, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 10, 'calories': 250, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'sweets-desserts', 'name': 'Mysore Pak', 'description': 'Traditional ghee-rich gram flour sweet from Karnataka. Pack of 4 pieces.', 'price': 100, 'meal_type': 'snack', 'food_type': 'veg', 'prep_time': 10, 'calories': 400, 'serves': 2},
            {'seller': 'Dakshin Flavors', 'category': 'snacks-chaat', 'name': 'Rava Upma', 'description': 'Semolina cooked with vegetables, mustard seeds, cashews and curry leaves.', 'price': 55, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 220, 'serves': 1},

            # === Dakshin Flavors - Tiffin Items (individual variety) ===
            {'seller': 'Dakshin Flavors', 'category': 'tiffin', 'name': 'Pongal', 'description': 'Creamy South Indian rice-lentil porridge tempered with black pepper, cumin and cashews.', 'price': 65, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 20, 'calories': 300, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'tiffin', 'name': 'Pesarattu', 'description': 'Crispy Andhra-style green gram crepe served with ginger chutney and upma.', 'price': 60, 'meal_type': 'breakfast', 'food_type': 'veg', 'prep_time': 15, 'calories': 270, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'tiffin', 'name': 'Bisi Bele Bath', 'description': 'Karnataka-style spiced rice with lentils, vegetables and bisi bele powder. Topped with ghee.', 'price': 90, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 25, 'calories': 420, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'tiffin', 'name': 'Lemon Rice', 'description': 'Tangy turmeric rice tempered with peanuts, curry leaves and dried red chillies.', 'price': 70, 'meal_type': 'lunch', 'food_type': 'veg', 'prep_time': 15, 'calories': 320, 'serves': 1},
            {'seller': 'Dakshin Flavors', 'category': 'tiffin', 'name': 'Set Dosa', 'description': 'Soft and spongy dosa set of 3, served with coconut chutney and vegetable kurma.', 'price': 75, 'meal_type': 'dinner', 'food_type': 'veg', 'prep_time': 15, 'calories': 350, 'serves': 1},
        ]

        created_count = 0
        for item_data in items:
            seller = sellers.get(item_data['seller'])
            category = categories.get(item_data['category'])
            if not seller or not category:
                self.stdout.write(self.style.WARNING(f'  Skipped: {item_data["name"]} (seller/category not found)'))
                continue

            slug = slugify(item_data['name'])
            base_slug = slug
            counter = 1
            while MenuItem.objects.filter(seller=seller, slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1

            defaults = {
                'category': category,
                'description': item_data['description'],
                'price': Decimal(str(item_data['price'])),
                'meal_type': item_data['meal_type'],
                'food_type': item_data['food_type'],
                'is_available': True,
                'is_active': True,
                'preparation_time_mins': item_data.get('prep_time', 20),
                'calories': item_data.get('calories'),
                'serves': item_data.get('serves', 1),
                'slug': slug,
            }
            if 'discounted_price' in item_data:
                defaults['discounted_price'] = Decimal(str(item_data['discounted_price']))

            _, created = MenuItem.objects.get_or_create(
                seller=seller,
                name=item_data['name'],
                defaults=defaults,
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {created_count} menu items (total: {MenuItem.objects.count()})'))

    def _create_subscription_plans(self):
        self.stdout.write('\nCreating subscription plans...')

        sellers = {p.kitchen_name: p for p in SellerProfile.objects.all()}

        plans = [
            # === Shree Balaji Tiffins ===
            {'seller': 'Shree Balaji Tiffins', 'name': 'Breakfast Only Plan', 'plan_type': 'breakfast', 'duration_days': 30, 'price': 1500, 'daily_price': 50, 'description': 'Daily breakfast tiffin - thepla, poha, dhokla etc. rotating menu. Fresh every morning at your door.'},
            {'seller': 'Shree Balaji Tiffins', 'name': 'Lunch Only Plan', 'plan_type': 'lunch', 'duration_days': 30, 'price': 2400, 'daily_price': 80, 'description': 'Full lunch tiffin with roti, rice, dal, sabzi and salad. Different menu daily.'},
            {'seller': 'Shree Balaji Tiffins', 'name': 'Lunch + Dinner Plan', 'plan_type': 'lunch_dinner', 'duration_days': 30, 'price': 4200, 'daily_price': 140, 'description': 'Two meals daily - lunch and dinner. Complete thali-style with variety each meal.'},
            {'seller': 'Shree Balaji Tiffins', 'name': 'All Meals Plan', 'plan_type': 'all_meals', 'duration_days': 30, 'price': 5400, 'daily_price': 180, 'description': 'Breakfast + Lunch + Dinner. Full day meals covered. Best value for money!'},

            # === Maa Ka Khana ===
            {'seller': 'Maa Ka Khana', 'name': 'Lunch Only Plan', 'plan_type': 'lunch', 'duration_days': 30, 'price': 2100, 'daily_price': 70, 'description': 'Ghar jaisa lunch daily - 3 roti, rice, dal, sabzi, salad, pickle. Maa ke haath ka swaad!'},
            {'seller': 'Maa Ka Khana', 'name': 'Dinner Only Plan', 'plan_type': 'dinner', 'duration_days': 30, 'price': 2100, 'daily_price': 70, 'description': 'Home-cooked dinner tiffin - roti, sabzi, dal, rice. Light yet fulfilling.'},
            {'seller': 'Maa Ka Khana', 'name': 'Lunch + Dinner Plan', 'plan_type': 'lunch_dinner', 'duration_days': 30, 'price': 3600, 'daily_price': 120, 'description': 'Two meals daily. Different sabzi each meal, fresh roti, dal, rice. Save ₹600/month!'},
            {'seller': 'Maa Ka Khana', 'name': 'All Meals Plan', 'plan_type': 'all_meals', 'duration_days': 30, 'price': 4800, 'daily_price': 160, 'description': 'Full day coverage - breakfast (paratha/poha) + lunch + dinner. Like having mom cook for you!'},

            # === Annapurna Kitchen ===
            {'seller': 'Annapurna Kitchen', 'name': 'Breakfast Only Plan', 'plan_type': 'breakfast', 'duration_days': 30, 'price': 1800, 'daily_price': 60, 'description': 'Maharashtrian breakfast daily - poha, upma, misal, sabudana khichdi. Rotating weekly menu.'},
            {'seller': 'Annapurna Kitchen', 'name': 'Lunch Only Plan', 'plan_type': 'lunch', 'duration_days': 30, 'price': 2700, 'daily_price': 90, 'description': 'Full Maharashtrian lunch - bhakri/roti, bhaji, amti, bhaat, koshimbir, papad.'},
            {'seller': 'Annapurna Kitchen', 'name': 'Lunch + Dinner Plan', 'plan_type': 'lunch_dinner', 'duration_days': 30, 'price': 4500, 'daily_price': 150, 'description': 'Two meals daily with authentic Maharashtrian flavours. Lunch & dinner both covered.'},

            # === Dakshin Flavors ===
            {'seller': 'Dakshin Flavors', 'name': 'Breakfast Only Plan', 'plan_type': 'breakfast', 'duration_days': 30, 'price': 1500, 'daily_price': 50, 'description': 'South Indian breakfast daily - idli, dosa, pongal, upma, pesarattu. With sambar & chutney.'},
            {'seller': 'Dakshin Flavors', 'name': 'Lunch Only Plan', 'plan_type': 'lunch', 'duration_days': 30, 'price': 2400, 'daily_price': 80, 'description': 'Full South Indian meals - rice, sambar, rasam, poriyal, curd, papad. Different menu daily.'},
            {'seller': 'Dakshin Flavors', 'name': 'All Meals Plan', 'plan_type': 'all_meals', 'duration_days': 30, 'price': 4800, 'daily_price': 160, 'description': 'Complete South Indian experience - breakfast + lunch + dinner. Authentic flavours all day.'},
        ]

        created_count = 0
        for plan_data in plans:
            seller = sellers.get(plan_data['seller'])
            if not seller:
                continue

            _, created = SubscriptionPlan.objects.get_or_create(
                seller=seller,
                name=plan_data['name'],
                defaults={
                    'plan_type': plan_data['plan_type'],
                    'duration_days': plan_data['duration_days'],
                    'price': Decimal(str(plan_data['price'])),
                    'daily_price': Decimal(str(plan_data['daily_price'])),
                    'description': plan_data['description'],
                    'includes_weekends': True,
                    'max_skips_allowed': 5,
                    'max_pauses_allowed': 2,
                    'is_active': True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {created_count} subscription plans (total: {SubscriptionPlan.objects.count()})'))

    def _add_images(self):
        """Generate and add placeholder images to categories and menu items."""
        self.stdout.write('\nGenerating images...')

        # Category images (square 200x200)
        cat_count = 0
        for cat in Category.objects.all():
            if not cat.icon:
                color = CATEGORY_COLORS.get(cat.slug, (149, 165, 166))
                img_data = generate_food_image(cat.name, color, size=(200, 200))
                if img_data:
                    cat.icon.save(f'{cat.slug}.jpg', ContentFile(img_data), save=True)
                    cat_count += 1
        self.stdout.write(f'  Category images: {cat_count}')

        # Menu item images (400x300)
        item_count = 0
        for item in MenuItem.objects.filter(image=''):
            color = get_item_color(item.food_type, item.meal_type)
            img_data = generate_food_image(item.name, color, size=(400, 300))
            if img_data:
                fname = f'{item.slug}-{item.seller.slug}.jpg'
                item.image.save(fname, ContentFile(img_data), save=True)
                item_count += 1
        self.stdout.write(f'  Menu item images: {item_count}')

        self.stdout.write(self.style.SUCCESS(f'  Total images generated: {cat_count + item_count}'))
