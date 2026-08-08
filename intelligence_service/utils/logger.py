import logging

logging.basicConfig(

    filename="logs/service.log",

    level=logging.INFO,

    format="%(asctime)s - %(message)s"

)

logger = logging.getLogger("EvoGuard")