#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour extraire les données depuis PostgreSQL et les convertir en format CSV
pour l'analyse dans le notebook Jupyter.
"""

import os
import sys

import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL


def get_connection_string():
    """
    Crée la chaîne de connexion avec les bons paramètres d'encodage
    """
    params = {
        'host': 'localhost',
        'database': 'minecraft_stats',
        'user': 'minecraft_stats',
        'password': 'minecraft_stats',
        'client_encoding': 'utf8',
        'options': '-c client_encoding=utf8'
    }

    url = URL.create(
        drivername="postgresql+psycopg2",
        username=params['user'],
        password=params['password'],
        host=params['host'],
        database=params['database'],
        query={
            'client_encoding': 'utf8',
            'options': '-c search_path=public -c client_encoding=utf8'
        }
    )

    return url, params

def extract_data_from_postgres():
    """
    Extrait les données de PostgreSQL et les convertit en DataFrames
    """
    print("📖 Connexion à PostgreSQL...")

    url, params = get_connection_string()
    tables = [
        'servers',
        'server_stats',
        'server_growth_stats',
        'categories',
        'server_categories',
        'languages',
        'server_languages'
    ]

    dataframes = {}

    try:
        with psycopg2.connect(**params) as conn:
            print("✅ Test de connexion psycopg2 réussi")

        engine = create_engine(url, echo=False)

        with engine.connect() as connection:
            version = connection.execute(text("SELECT version()")).scalar()
            print(f"✅ Connecté à PostgreSQL : {version}")

            connection.execute(text("SET client_encoding TO 'UTF8'"))

            for table in tables:
                try:
                    query = text(f'SELECT * FROM "{table}"')
                    df = pd.read_sql_query(query, connection)
                    dataframes[table] = df
                    print(f"✅ Table {table} : {len(df)} lignes extraites")
                except Exception as e:
                    print(f"⚠️  Table {table} non trouvée ou erreur : {str(e)}")

        return dataframes

    except Exception as e:
        print(f"❌ Erreur de connexion à PostgreSQL : {str(e)}")
        return None
    finally:
        if 'engine' in locals():
            engine.dispose()

def export_to_csv(dataframes, output_dir):
    """
    Exporte les DataFrames en fichiers CSV
    """
    os.makedirs(output_dir, exist_ok=True)

    for table_name, df in dataframes.items():
        csv_path = os.path.join(output_dir, f"{table_name}.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"✅ {table_name}.csv exporté ({len(df)} lignes)")

def create_sqlite_database(dataframes, output_path):
    """
    Crée une base SQLite à partir des DataFrames extraits
    """
    print(f"💾 Création de la base SQLite : {output_path}")

    engine = create_engine(f'sqlite:///{output_path}')

    for table_name, df in dataframes.items():
        df.to_sql(table_name, engine, if_exists='replace', index=False)
        print(f"✅ Table {table_name} créée avec {len(df)} lignes")

    engine.dispose()
    print("✅ Base SQLite créée avec succès !")

def main():
    """
    Fonction principale
    """
    output_dir = "extracted_data"
    sqlite_db = "minecraft_stats.db"

    print("🚀 Début de l'extraction des données...")

    try:
        dataframes = extract_data_from_postgres()

        if not dataframes:
            print("❌ Aucune donnée extraite de PostgreSQL")
            return

        export_to_csv(dataframes, output_dir)
        create_sqlite_database(dataframes, sqlite_db)

        print("\n📊 RÉSUMÉ DE L'EXTRACTION :")
        print("=" * 40)
        for table_name, df in dataframes.items():
            print(f"   {table_name}: {len(df)} lignes, {len(df.columns)} colonnes")

        print("\n✅ Extraction terminée !")
        print(f"   📁 CSV dans : {output_dir}/")
        print(f"   🗄️  SQLite : {sqlite_db}")
        print("   📓 Prêt pour l'analyse dans le notebook !")

    except Exception as e:
        print(f"❌ Erreur lors de l'extraction : {str(e)}")

if __name__ == "__main__":
    main()
