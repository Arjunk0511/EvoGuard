# ==========================================
# EvoGuard Intelligence Service
# ==========================================

from flask import Flask

from config import HOST, PORT, DEBUG

from routes.predict import predict_bp

app = Flask(__name__)

app.register_blueprint(predict_bp)


@app.route("/")
def home():

    return {

        "service": "EvoGuard Intelligence Service",

        "status": "Running"

    }


@app.route("/health")
def health():

    return {

        "status": "healthy"

    }


if __name__ == "__main__":

    app.run(

        host=HOST,

        port=PORT,

        debug=DEBUG

    )